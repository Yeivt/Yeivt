import { authHandler } from '../_shared/intercessor-auth.ts';
Deno.serve(authHandler());
