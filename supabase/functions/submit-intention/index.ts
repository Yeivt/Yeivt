import { publicHandler } from '../_shared/public-handler.ts';
import { env, rest, verifyCaptcha } from '../_shared/platform.ts';
import { rateKey } from '../_shared/intercessor-auth.ts';

Deno.serve(publicHandler({
  origin: env('APP_ORIGIN'), verify: verifyCaptcha,
  save: async (s, request) => rest('rpc/create_intention','POST', {
    p_submission_id:s.submissionId,p_name:s.name,p_message:s.message,p_kind:s.kind,
    p_rate_key:await rateKey(request,'intention'),
  }),
}));
