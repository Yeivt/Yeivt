import { demoMode, errorText, message, supabase } from '../lib/client';

type Intention = { id: string; name: string; message: string; kind: string; status: string; created_at: string; assigned_to: string | null };
const login = document.querySelector<HTMLElement>('#login-panel')!;
const dashboard = document.querySelector<HTMLElement>('#priest-dashboard')!;
const status = document.querySelector<HTMLElement>('#dashboard-status');
const authStatus = document.querySelector<HTMLElement>('#auth-status');
const demoButton = document.querySelector<HTMLButtonElement>('#demo-login')!;
let userId = 'demo-priest';
let entries: Intention[] = [
  { id: 'demo-1', name: 'Una persona de la comunidad', kind: 'petition', message: 'Pido una oración por mi familia, para que podamos acompañarnos con paciencia y encontrar paz.', status: 'pending', created_at: new Date().toISOString(), assigned_to: null },
  { id: 'demo-2', name: 'Un corazón agradecido', kind: 'gratitude', message: 'Quiero dar gracias por las personas que me acompañaron en un momento difícil.', status: 'pending', created_at: new Date().toISOString(), assigned_to: null },
];
let busy = false;

function renderList(containerId: string, list: Intention[], assigned: boolean) {
  const container = document.querySelector<HTMLElement>(containerId)!;
  container.replaceChildren();
  if (!list.length) { const empty = document.createElement('p'); empty.className = 'list-empty'; empty.textContent = assigned ? 'Cuando recibas una intención, la encontrarás aquí.' : 'No hay intenciones pendientes en este momento.'; container.append(empty); }
  for (const entry of list) {
    const card = document.createElement('article'); card.className = 'intention-card';
    const title = document.createElement('h3'); title.textContent = entry.name;
    const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = `${entry.kind === 'gratitude' ? 'Agradecimiento' : 'Petición'} · ${new Date(entry.created_at).toLocaleDateString('es-AR')}`;
    card.append(title, meta);
    if (assigned) { const text = document.createElement('p'); text.className = 'intention-message'; text.textContent = entry.message; card.append(text); }
    const actions = document.createElement('div'); actions.className = 'actions';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'button'; button.disabled = busy;
    button.textContent = assigned ? 'Marcar como rezada' : 'Recibir y leer intención';
    button.addEventListener('click', () => transition(entry, assigned ? 'complete' : 'claim'));
    actions.append(button);
    if (assigned) { const release = document.createElement('button'); release.type = 'button'; release.className = 'text-button'; release.disabled = busy; release.textContent = 'Devolver a pendientes'; release.addEventListener('click', () => transition(entry, 'release')); actions.append(release); }
    card.append(actions); container.append(card);
  }
}

function render() {
  const pending = entries.filter(entry => entry.status === 'pending');
  const assigned = entries.filter(entry => entry.status === 'assigned' && entry.assigned_to === userId);
  document.querySelector('#pending-count')!.textContent = String(pending.length);
  document.querySelector('#assigned-count')!.textContent = String(assigned.length);
  renderList('#pending-list', pending, false); renderList('#assigned-list', assigned, true);
}

async function load() {
  if (!demoMode && supabase) {
    // Fetch queues separately so a large pending queue cannot hide owned work.
    // RLS remains authoritative even if a client tampers with these filters.
    const fields = 'id,name,message,kind,status,created_at,assigned_to';
    const pending = await supabase.from('intentions').select(fields).eq('status', 'pending').order('created_at').order('id').limit(100);
    if (pending.error) throw new Error('No pudimos cargar las intenciones. Revisa tu sesión o vuelve a intentarlo.');
    const assigned: Intention[] = [];
    for (let offset = 0; ; offset += 100) {
      const result = await supabase.from('intentions').select(fields).eq('status', 'assigned').eq('assigned_to', userId).order('created_at').order('id').range(offset, offset + 99);
      if (result.error) throw new Error('No pudimos cargar tus intenciones asignadas. Inténtalo nuevamente.');
      assigned.push(...result.data);
      if (result.data.length < 100) break;
    }
    entries = [...(pending.data || []), ...assigned];
  }
  render();
}

async function transition(entry: Intention, action: 'claim' | 'complete' | 'release') {
  if (busy) return;
  if (action === 'complete' && !window.confirm('¿Ya presentaste esta intención en oración? Se enviará un único correo de confirmación.')) return;
  if (action === 'release' && !window.confirm('¿Quieres devolver esta intención para que otra persona pueda recibirla?')) return;
  busy = true; render(); message(status, '');
  try {
    if (demoMode) {
      entry.status = action === 'claim' ? 'assigned' : action === 'complete' ? 'completed' : 'pending';
      entry.assigned_to = action === 'release' ? null : userId;
    } else {
      const { error } = await supabase!.rpc(`${action}_intention`, { p_id: entry.id });
      if (error) throw new Error(action === 'claim' ? 'Esta intención ya no está disponible. Actualiza la lista para recibir otra.' : 'No se pudo actualizar la intención. Revisa tu conexión e inténtalo nuevamente.');
    }
    await load();
    message(status, action === 'complete' ? (demoMode ? 'Demostración: intención completada. No se envió ningún correo.' : 'Intención completada. Su único correo de confirmación quedó programado.') : action === 'claim' ? 'La intención quedó asignada a ti. Puedes leerla en “Mis intenciones asignadas”.' : 'La intención volvió a estar disponible.');
  } catch (error) { message(status, errorText(error), true); }
  finally { busy = false; render(); }
}

async function enter() {
  if (!demoMode && supabase) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return;
    const { data: member } = await supabase.from('members').select('display_name,role,approved').eq('user_id', session.user.id).maybeSingle();
    if (!member?.approved || !['priest', 'intercessor'].includes(member.role)) { await supabase.auth.signOut(); message(authStatus, 'Tu cuenta todavía no está habilitada para recibir intenciones.', true); return; }
    userId = session.user.id;
    document.querySelector('#welcome-priest')!.textContent = `Bienvenido, ${member.display_name}`;
  }
  await load(); login.hidden = true; dashboard.hidden = false;
}

document.querySelector<HTMLFormElement>('#login-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (demoMode) { message(authStatus, 'En demostración no enviamos enlaces. Puedes explorar el panel con el botón de abajo.'); return; }
  const form = event.currentTarget as HTMLFormElement; const button = form.querySelector<HTMLButtonElement>('button')!;
  button.disabled = true;
  try {
    const { error } = await supabase!.auth.signInWithOtp({ email: String(new FormData(form).get('email')).trim(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/sacerdotes/` } });
    if (error) throw new Error('No pudimos enviar el enlace. Verifica que tu cuenta esté aprobada o inténtalo más tarde.');
    message(authStatus, 'Revisa tu correo para ingresar mediante el enlace de acceso.');
  } catch (error) { message(authStatus, errorText(error), true); }
  finally { button.disabled = false; }
});

demoButton.hidden = !demoMode;
demoButton.addEventListener('click', () => enter().catch(error => message(authStatus, errorText(error), true)));
document.querySelector('#refresh-intentions')!.addEventListener('click', () => load().catch(error => message(status, errorText(error), true)));
document.querySelector('#logout')!.addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut();
  entries = []; render(); dashboard.hidden = true; login.hidden = false;
  if (demoMode) window.location.reload();
});
if (!demoMode) {
  enter().catch(error => message(authStatus, errorText(error), true));
  supabase?.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { entries = []; render(); dashboard.hidden = true; login.hidden = false; }
    // Keep asynchronous Supabase calls outside the auth callback's lock.
    if (event === 'SIGNED_IN') setTimeout(() => enter().catch(error => message(authStatus, errorText(error), true)), 0);
  });
}
