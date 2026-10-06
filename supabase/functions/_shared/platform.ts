import { HttpError } from './domain.ts';

export function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(503, 'Servicio todavía no configurado.');
  return value;
}

export async function rest(path: string, method = 'GET', body?: unknown, token = env('SUPABASE_SERVICE_ROLE_KEY')): Promise<any> {
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, {
    method, headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    if (problem.message === 'rate_limit') throw new HttpError(429, 'Ya recibimos varias solicitudes. Inténtalo más tarde.');
    throw new HttpError(502, 'No pudimos completar la operación. Inténtalo nuevamente.');
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer .+/.test(authorization)) throw new HttpError(401, 'Debes iniciar sesión.');
  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: authorization }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(401, 'La sesión no es válida.');
  const user = await response.json();
  const members = await rest(`members?user_id=eq.${encodeURIComponent(user.id)}&approved=eq.true&role=eq.admin&select=user_id`);
  if (members.length !== 1) throw new HttpError(403, 'Acceso reservado al equipo responsable.');
  return user.id as string;
}

export async function verifyCaptcha(token: string, action: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env('TURNSTILE_SECRET_KEY'), response: token }), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || !result.success || result.action !== action || result.hostname !== new URL(env('APP_ORIGIN')).hostname) {
    throw new HttpError(400, 'La verificación venció. Vuelve a completarla.');
  }
}
