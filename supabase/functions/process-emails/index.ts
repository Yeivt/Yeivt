import { processEmails } from '../_shared/email-worker.ts';
import { jsonResponse } from '../_shared/domain.ts';
import { env, rest } from '../_shared/platform.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405);
  if (request.headers.get('authorization') !== `Bearer ${env('MAIL_WORKER_SECRET')}`) return jsonResponse({ error: 'No autorizado.' }, 401);
  try {
    const result = await processEmails({
      from: env('MAIL_FROM'), apiKey: env('RESEND_API_KEY'),
      take: async () => (await rest('rpc/take_email_job', 'POST', {}))[0] || null,
      finish: async (job, id) => {
        const saved = await rest('rpc/finish_email_job', 'POST', { p_id: job.id, p_lease: job.lease_token, p_provider_id: id });
        if (!saved) throw new Error('lease_expired');
      },
      retry: async (job, error) => { await rest('rpc/retry_email_job', 'POST', { p_id: job.id, p_lease: job.lease_token, p_error: error }); },
    });
    return jsonResponse(result);
  } catch { return jsonResponse({ error: 'La tarea de correo no pudo completarse.' }, 503); }
});
