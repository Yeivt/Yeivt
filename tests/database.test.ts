import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

let db: PGlite;
const priestA = randomUUID(), priestB = randomUUID(), outsider = randomUUID(), admin = randomUUID();
before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text unique);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  for (const name of ['202610060001_initial.sql', '202610060002_access_approval.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  for (const [id, email, role, approved] of [[priestA, 'a@example.com', 'priest', true], [priestB, 'b@example.com', 'priest', true], [outsider, 'outside@example.com', 'priest', false], [admin, 'admin@example.com', 'admin', true]] as const) {
    await db.query('insert into auth.users(id,email) values($1,$2)', [id, email]);
    await db.query('insert into public.members(user_id,display_name,role,approved) values($1,$2,$3,$4)', [id, 'Usuario de prueba', role, approved]);
  }
});
after(async () => { await db.close(); });

async function asUser<T>(id: string, work: () => Promise<T>): Promise<T> {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  try { return await work(); } finally { await db.exec('reset role'); }
}
async function create(email = `${randomUUID()}@example.com`, key = randomUUID()) {
  const result = await db.query<{ id: string }>('select public.create_intention($1,$2,$3,$4,$5) as id', [key, 'Alias privado', email, 'Una petición suficientemente larga.', 'petition']);
  return result.rows[0].id;
}

test('anonymous visitors cannot read intentions, contacts or insert through RPC', async () => {
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query('select * from public.intentions'), /permission denied/);
    await assert.rejects(db.query('select * from public.intention_contacts'), /permission denied/);
    await assert.rejects(db.query('select public.create_intention($1,$2,$3,$4,$5)', [randomUUID(), 'Name', 'a@b.com', 'Long enough message', 'petition']), /permission denied/);
  } finally { await db.exec('reset role'); }
});

test('unapproved members cannot see or claim intentions', async () => {
  const id = await create();
  await asUser(outsider, async () => {
    assert.equal((await db.query('select * from public.intentions')).rows.length, 0);
    await assert.rejects(db.query('select * from public.claim_intention($1)', [id]), /not_authorized/);
  });
});

test('claiming hides an intention from another priest while retaining it for its owner', async () => {
  const id = await create();
  await asUser(priestA, async () => {
    const row = (await db.query<any>('select * from public.claim_intention($1)', [id])).rows[0];
    assert.equal(row.assigned_to, priestA); assert.equal('email' in row, false);
    assert.equal((await db.query('select * from public.intentions where id=$1', [id])).rows.length, 1);
    await assert.rejects(db.query('select * from public.intention_contacts'), /permission denied/);
    await assert.rejects(db.query("update public.intentions set status='completed' where id=$1", [id]), /permission denied/);
  });
  await asUser(priestB, async () => {
    assert.equal((await db.query('select * from public.intentions where id=$1', [id])).rows.length, 0);
    await assert.rejects(db.query('select * from public.claim_intention($1)', [id]), /intention_unavailable/);
    await assert.rejects(db.query('select public.complete_intention($1)', [id]), /not_authorized/);
  });
});

test('completion queues one email even if repeated and removes the intention from its owner', async () => {
  const id = await create();
  await asUser(priestA, async () => {
    await db.query('select * from public.claim_intention($1)', [id]);
    await db.query('select public.complete_intention($1)', [id]);
    await db.query('select public.complete_intention($1)', [id]);
    assert.equal((await db.query('select * from public.intentions where id=$1', [id])).rows.length, 0);
    await assert.rejects(db.query('select * from public.email_jobs'), /permission denied/);
  });
  assert.equal((await db.query('select * from public.email_jobs where intention_id=$1', [id])).rows.length, 1);
});

test('an owner can return an intention for another priest to claim', async () => {
  const id = await create();
  await asUser(priestA, async () => { await db.query('select * from public.claim_intention($1)', [id]); await db.query('select public.release_intention($1)', [id]); });
  await asUser(priestB, async () => { assert.equal((await db.query<any>('select * from public.claim_intention($1)', [id])).rows[0].assigned_to, priestB); });
});

test('submission idempotency and server rate limits are enforced in SQL', async () => {
  const key = randomUUID(); const email = `${randomUUID()}@example.com`;
  assert.equal(await create(email, key), await create(email, key));
  await create(email); await create(email);
  await assert.rejects(create(email), /rate_limit/);
});

test('email leases prevent double pickup, stale acknowledgements and late automatic retries', async () => {
  await db.exec("update public.email_jobs set status='sent'");
  const id = await create();
  await asUser(priestA, async () => { await db.query('select * from public.claim_intention($1)', [id]); await db.query('select public.complete_intention($1)', [id]); });
  const job = (await db.query<any>('select * from public.take_email_job()')).rows[0];
  assert.equal(job.intention_id, id); assert.ok(job.email);
  assert.equal((await db.query('select * from public.take_email_job()')).rows.length, 0);
  assert.equal((await db.query<any>('select public.finish_email_job($1,$2,$3) as ok', [job.id, randomUUID(), 'provider'])).rows[0].ok, false);
  await db.query('select public.retry_email_job($1,$2,$3)', [job.id, job.lease_token, 'timeout']);
  await db.query("update public.email_jobs set first_attempt_at=now()-interval '24 hours', next_attempt_at=now()-interval '1 minute' where id=$1", [job.id]);
  assert.equal((await db.query('select * from public.take_email_job()')).rows.length, 0);
  assert.equal((await db.query<any>('select status from public.email_jobs where id=$1', [job.id])).rows[0].status, 'review');
});

test('approval is admin-only and verifies email identity before creating a membership', async () => {
  const user = randomUUID(), requestId = randomUUID();
  await db.query('insert into auth.users(id,email) values($1,$2)', [user, 'new@example.com']);
  await db.query('insert into public.access_requests(id,submission_id,name,email,community,message) values($1,$2,$3,$4,$5,$6)', [requestId, randomUUID(), 'Nuevo sacerdote', 'new@example.com', 'Una comunidad', 'Una presentación verificable.']);
  await assert.rejects(db.query('select public.approve_access_request($1,$2,$3)', [requestId, user, priestA]), /not_authorized/);
  await assert.rejects(db.query('select public.approve_access_request($1,$2,$3)', [requestId, outsider, admin]), /identity_mismatch/);
  await db.query('select public.approve_access_request($1,$2,$3)', [requestId, user, admin]);
  const member = (await db.query<any>('select role,approved from public.members where user_id=$1', [user])).rows[0];
  assert.deepEqual(member, { role: 'priest', approved: true });
  await asUser(priestA, async () => { await assert.rejects(db.query('select public.approve_access_request($1,$2,$3)', [requestId, user, admin]), /permission denied/); });
});

test('retention deletes old personal data and related contacts and email jobs', async () => {
  const id = await create();
  await db.query("update public.intentions set created_at=now()-interval '181 days' where id=$1", [id]);
  await db.query('select public.cleanup_personal_data()');
  assert.equal((await db.query('select * from public.intentions where id=$1', [id])).rows.length, 0);
  assert.equal((await db.query('select * from public.intention_contacts where intention_id=$1', [id])).rows.length, 0);
});
