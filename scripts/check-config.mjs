import { loadEnv } from 'vite';
const configuration = { ...loadEnv('production', process.cwd(), ''), ...process.env };
if (configuration.PUBLIC_DEMO_MODE === 'false') {
  const missing = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'PUBLIC_TURNSTILE_SITE_KEY'].filter(name => !configuration[name]);
  if (missing.length) throw new Error(`Falta configurar: ${missing.join(', ')}. Usa PUBLIC_DEMO_MODE=true solo para demostración.`);
  const url = new URL(configuration.PUBLIC_SUPABASE_URL);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Supabase debe usar HTTPS.');
}
