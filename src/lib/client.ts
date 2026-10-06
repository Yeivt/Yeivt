import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
export const demoMode = import.meta.env.PUBLIC_DEMO_MODE === 'true' || !url || !key;
export const supabase = !demoMode && url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export async function invoke<T>(name: string, body: unknown, authenticated = false): Promise<T> {
  if (!url || !key || !supabase) throw new Error('El servicio todavía no está conectado.');
  const session = authenticated ? (await supabase.auth.getSession()).data.session : null;
  if (authenticated && !session) throw new Error('Inicia sesión nuevamente.');
  const response = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${session?.access_token || key}` },
    body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'No pudimos completar la operación. Inténtalo nuevamente.');
  return result as T;
}

export function message(element: HTMLElement | null, text: string, error = false) {
  if (element) { element.textContent = text; element.dataset.error = String(error); }
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'No pudimos completar la operación. Inténtalo nuevamente.';
}
