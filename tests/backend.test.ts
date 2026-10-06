import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CONFIRMATION_MESSAGE, HttpError, parseSubmission } from '../supabase/functions/_shared/domain.ts';
import { publicHandler } from '../supabase/functions/_shared/public-handler.ts';
import { processEmails, type EmailJob } from '../supabase/functions/_shared/email-worker.ts';
import { requireAdmin } from '../supabase/functions/_shared/platform.ts';

const valid = () => ({ submissionId: randomUUID(), name: 'Un alias', email: 'PERSONA@example.com', message: 'Una intención suficientemente larga.', kind: 'petition', consent: true, website: '', token: 'test-token' });
const request = (body: unknown, origin = 'https://misterio.example') => new Request('https://project.supabase.co/functions/v1/submit-intention', {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('validates consent, email, type, lengths and captcha before saving', () => {
  assert.equal(parseSubmission(valid()).email, 'persona@example.com');
  for (const patch of [{ consent: false }, { name: 'A' }, { email: 'invalid' }, { message: 'x'.repeat(2001) }, { kind: 'other' }, { website: 'bot' }, { token: '' }, { submissionId: 'invalid' }]) {
    assert.throws(() => parseSubmission({ ...valid(), ...patch }), HttpError);
  }
  assert.throws(() => parseSubmission(valid(), true), HttpError);
  assert.equal(parseSubmission({ ...valid(), community: 'Parroquia de ejemplo' }, true).community, 'Parroquia de ejemplo');
});

test('accepts a verified submission without returning personal data', async () => {
  let saved = 0; let verified = false;
  const handler = publicHandler({ origin: 'https://misterio.example', verify: async (token, action) => { assert.equal(token, 'test-token'); assert.equal(action, 'intention'); verified = true; }, save: async () => { assert.equal(verified, true); saved++; } });
  const response = await handler(request(valid()));
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { ok: true });
  assert.equal(saved, 1); assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('rejects other origins and failed captcha without any database write', async () => {
  let saves = 0;
  const handler = publicHandler({ origin: 'https://misterio.example', verify: async () => { throw new HttpError(400, 'Verificación inválida.'); }, save: async () => { saves++; } });
  const foreign = await handler(request(valid(), 'https://foreign.example'));
  assert.equal(foreign.status, 403); assert.equal(foreign.headers.get('access-control-allow-origin'), null);
  assert.equal((await handler(request(valid()))).status, 400); assert.equal(saves, 0);
});

test('bounds streamed request bodies even without Content-Length', async () => {
  const handler = publicHandler({ origin: 'https://misterio.example', verify: async () => {}, save: async () => { assert.fail('should not save'); } });
  assert.equal((await handler(request({ ...valid(), message: 'a'.repeat(17000) }))).status, 413);
});

const job: EmailJob = { id: 'job-id', intention_id: 'intention-id', email: 'recipient@example.com', lease_token: 'lease-id', attempts: 1 };
test('sends exactly the chosen message with a stable provider idempotency key', async () => {
  let takes = 0; let acknowledgements = 0;
  const result = await processEmails({ from: 'Misterio <oracion@example.com>', apiKey: 'test-only', take: async () => takes++ === 0 ? job : null,
    fetcher: async (url, init) => {
      assert.equal(url, 'https://api.resend.com/emails');
      assert.equal((init!.headers as Record<string, string>)['Idempotency-Key'], 'misterio-intention-intention-id');
      const body = JSON.parse(String(init!.body));
      assert.equal(body.text, CONFIRMATION_MESSAGE); assert.deepEqual(body.to, [job.email]);
      assert.deepEqual(Object.keys(body).sort(), ['from', 'subject', 'text', 'to']);
      return Response.json({ id: 'provider-id' });
    }, finish: async (entry, id) => { assert.equal(entry.id, job.id); assert.equal(id, 'provider-id'); acknowledgements++; }, retry: async () => assert.fail('should not retry'),
  });
  assert.deepEqual(result, { sent: 1, failed: 0 }); assert.equal(acknowledgements, 1);
});

test('a delivery with a lost acknowledgement retries using the same idempotency key', async () => {
  const keys: string[] = []; let attempt = 0; let retry = 0;
  await processEmails({ from: 'oracion@example.com', apiKey: 'test-only', take: async () => attempt++ < 2 ? job : null,
    fetcher: async (_url, init) => { keys.push((init!.headers as Record<string, string>)['Idempotency-Key']); return Response.json({ id: 'same-provider-id' }); },
    finish: async () => { if (attempt === 1) throw new Error('ack failed'); }, retry: async (_entry, reason) => { assert.equal(reason, 'delivery_or_ack_failed'); retry++; },
  });
  assert.equal(retry, 1); assert.equal(keys.length, 2); assert.equal(keys[0], keys[1]);
});

test('provider errors retain only an operational code, never an email or body', async () => {
  let seen: string | undefined; let take = true;
  await processEmails({ from: 'oracion@example.com', apiKey: 'test-only', take: async () => { if (!take) return null; take = false; return job; },
    fetcher: async () => new Response('private provider body', { status: 429 }), finish: async () => assert.fail(), retry: async (_job, reason) => { seen = reason; },
  });
  assert.equal(seen, 'provider_http_429');
});

test('admin access checks the JWT with Auth and a current approved admin membership', async () => {
  const priorDeno = (globalThis as any).Deno; const priorFetch = globalThis.fetch;
  (globalThis as any).Deno = { env: { get: (key: string) => ({ SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-only' }[key]) } };
  try {
    await assert.rejects(requireAdmin(new Request('https://example.com')), (error: unknown) => error instanceof HttpError && error.status === 401);
    let isAdmin = false;
    globalThis.fetch = async (url) => String(url).endsWith('/auth/v1/user') ? Response.json({ id: 'user-id' }) : Response.json(isAdmin ? [{ user_id: 'user-id' }] : []);
    const authenticated = new Request('https://example.com', { headers: { authorization: 'Bearer test-session' } });
    await assert.rejects(requireAdmin(authenticated), (error: unknown) => error instanceof HttpError && error.status === 403);
    isAdmin = true; assert.equal(await requireAdmin(authenticated), 'user-id');
  } finally { globalThis.fetch = priorFetch; (globalThis as any).Deno = priorDeno; }
});
