import { publicHandler } from '../_shared/public-handler.ts';
import { env, rest, verifyCaptcha } from '../_shared/platform.ts';

Deno.serve(publicHandler({
  origin: env('APP_ORIGIN'), verify: verifyCaptcha,
  save: (s) => rest('rpc/create_intention', 'POST', { p_submission_id: s.submissionId, p_name: s.name, p_email: s.email, p_message: s.message, p_kind: s.kind }),
}));
