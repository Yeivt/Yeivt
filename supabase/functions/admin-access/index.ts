import { HttpError, jsonResponse, readBody, requireOrigin } from '../_shared/domain.ts';
import { env, requireAdmin, rest } from '../_shared/platform.ts';

Deno.serve(async (request) => {
  let origin: string | undefined;
  try {
    origin = requireOrigin(request, env('APP_ORIGIN'));
    if (request.method === 'OPTIONS') return jsonResponse({}, 200, origin);
    if (request.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
    const adminId = await requireAdmin(request);
    const body = await readBody(request) as Record<string, unknown>;
    if (body.action === 'list') return jsonResponse(await rest('access_requests?status=eq.pending&select=id,name,email,community,message&order=created_at.asc&limit=100'), 200, origin);
    if (!['approve', 'reject'].includes(String(body.action)) || typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) throw new HttpError(400, 'Operación inválida.');
    const requests = await rest(`access_requests?id=eq.${body.id}&select=*`);
    const entry = requests[0];
    if (!entry) throw new HttpError(404, 'Solicitud no encontrada.');
    if (entry.status !== 'pending') return jsonResponse({ ok: true }, 200, origin);
    if (body.action === 'reject') {
      await rest(`access_requests?id=eq.${body.id}&status=eq.pending`, 'PATCH', { status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString() });
    } else {
      // Auth's unique email and a DB transaction make repeated approvals safe.
      // The membership transaction also checks a concurrent rejection.
      let userId: string | undefined = entry.invited_user_id;
      if (!userId) {
        const invited = await fetch(`${env('SUPABASE_URL')}/auth/v1/invite?redirect_to=${encodeURIComponent(`${env('APP_ORIGIN')}/sacerdotes/`)}`, {
          method: 'POST', headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: entry.email, data: { display_name: entry.name } }), signal: AbortSignal.timeout(15000),
        });
        if (invited.ok) { userId = (await invited.json()).id; }
        else {
          // Recover a previous partial invitation using a privileged SQL lookup.
          const existing = await rest('rpc/find_auth_user', 'POST', { p_email: entry.email });
          if (!existing) throw new HttpError(502, 'No se pudo enviar la invitación. Revisa el correo de autenticación e inténtalo nuevamente.');
          userId = existing;
        }
      }
      await rest('rpc/approve_access_request', 'POST', { p_id: entry.id, p_user_id: userId, p_admin_id: adminId });
    }
    return jsonResponse({ ok: true }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: error instanceof HttpError ? error.message : 'No pudimos revisar la solicitud.' }, error instanceof HttpError ? error.status : 500, origin);
  }
});
