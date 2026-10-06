import { demoMode, errorText, invoke, message, supabase } from '../lib/client';
type AccessRequest = { id: string; name: string; email: string; community: string; message: string };
const login = document.querySelector<HTMLElement>('#admin-login')!;
const dashboard = document.querySelector<HTMLElement>('#admin-dashboard')!;
const status = document.querySelector<HTMLElement>('#admin-status');
const authStatus = document.querySelector<HTMLElement>('#admin-auth-status');
const demoButton = document.querySelector<HTMLButtonElement>('#demo-admin')!;
let requests: AccessRequest[] = [{ id: 'demo-access', name: 'Sacerdote de ejemplo', email: 'ejemplo@example.com', community: 'Comunidad ficticia', message: 'Solicitud de ejemplo para conocer el proceso de aprobación manual.' }];
let busy = false;

function render() {
  const list = document.querySelector('#access-requests')!; list.replaceChildren();
  if (!requests.length) { const p = document.createElement('p'); p.className = 'list-empty'; p.textContent = 'No hay solicitudes pendientes.'; list.append(p); }
  requests.forEach(entry => {
    const card = document.createElement('article'); card.className = 'intention-card';
    const title = document.createElement('h3'); title.textContent = entry.name;
    const email = document.createElement('p'); email.textContent = entry.email;
    const community = document.createElement('p'); community.textContent = entry.community;
    const presentation = document.createElement('p'); presentation.className = 'intention-message'; presentation.textContent = entry.message;
    const actions = document.createElement('div'); actions.className = 'actions';
    for (const action of ['approve', 'reject'] as const) {
      const button = document.createElement('button'); button.type = 'button'; button.className = action === 'approve' ? 'button' : 'button secondary'; button.disabled = busy;
      button.textContent = action === 'approve' ? 'Identidad verificada · Aprobar' : 'Rechazar solicitud';
      button.addEventListener('click', async () => {
        if (busy || !window.confirm(action === 'approve' ? '¿Verificaste personalmente su identidad y ministerio? Se habilitará la cuenta y podrá recibir intenciones.' : '¿Quieres rechazar esta solicitud?')) return;
        busy = true; render();
        try {
          if (!demoMode) await invoke('admin-access', { action, id: entry.id }, true);
          requests = requests.filter(request => request.id !== entry.id);
          message(status, demoMode ? 'Demostración: solicitud revisada. No se creó ninguna cuenta.' : 'Solicitud revisada.');
        } catch (error) { message(status, errorText(error), true); }
        finally { busy = false; render(); }
      });
      actions.append(button);
    }
    card.append(title, email, community, presentation, actions); list.append(card);
  });
}

async function enter() {
  if (!demoMode && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    requests = await invoke<AccessRequest[]>('admin-access', { action: 'list' }, true);
  }
  render(); login.hidden = true; dashboard.hidden = false;
}
demoButton.hidden = !demoMode;
demoButton.addEventListener('click', () => enter());
document.querySelector<HTMLFormElement>('#admin-login-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (demoMode) { message(authStatus, 'Puedes explorar las solicitudes ficticias con el botón de abajo.'); return; }
  const form = event.currentTarget as HTMLFormElement; const button = form.querySelector<HTMLButtonElement>('button')!; button.disabled = true;
  try {
    const { error } = await supabase!.auth.signInWithOtp({ email: String(new FormData(form).get('email')).trim(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin/` } });
    if (error) throw new Error('No se pudo enviar el enlace de acceso.');
    message(authStatus, 'Revisa tu correo para ingresar.');
  } catch (error) { message(authStatus, errorText(error), true); }
  finally { button.disabled = false; }
});
document.querySelector('#admin-logout')!.addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut(); requests = []; render(); dashboard.hidden = true; login.hidden = false;
  if (demoMode) window.location.reload();
});
if (!demoMode) {
  enter().catch(error => message(authStatus, errorText(error), true));
  supabase?.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') { requests = []; render(); dashboard.hidden = true; login.hidden = false; }
    if (event === 'SIGNED_IN') setTimeout(() => enter().catch(error => message(authStatus, errorText(error), true)), 0);
  });
}
