import { publicHandler } from '../_shared/public-handler.ts';
import { env, rest, verifyCaptcha } from '../_shared/platform.ts';

Deno.serve(publicHandler({
  origin: env('APP_ORIGIN'), access: true, verify: verifyCaptcha,
  save: (s) => rest('rpc/create_access_request', 'POST', { p_submission_id: s.submissionId, p_name: s.name, p_email: s.email, p_message: s.message, p_community: s.community }),
}));
