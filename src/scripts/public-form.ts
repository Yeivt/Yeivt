import { demoMode, errorText, invoke, message } from '../lib/client';

let captchaPromise: Promise<void> | undefined;
function loadCaptcha() {
  if (window.turnstile) return Promise.resolve();
  return captchaPromise ||= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error('No se pudo cargar la verificación. Revisa tu conexión.'));
    document.head.append(script);
  });
}

document.querySelectorAll<HTMLFormElement>('.public-form').forEach(form => {
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const status = form.querySelector<HTMLElement>('.form-status');
  const label = button.textContent;
  let submissionId = crypto.randomUUID();
  let widget: string | undefined;
  const sitekey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
  if (!demoMode) {
    button.disabled = true;
    if (!sitekey) message(status, 'El envío aún no está habilitado. Falta configurar la verificación de seguridad.', true);
    else loadCaptcha().then(() => {
      widget = window.turnstile!.render(form.querySelector<HTMLElement>('.captcha')!, {
        sitekey, action: 'intention',
        callback: () => { button.disabled = false; },
        'expired-callback': () => { button.disabled = true; },
        'error-callback': () => { button.disabled = true; message(status, 'No se pudo completar la verificación. Recarga la página.', true); },
      });
    }).catch(error => message(status, errorText(error), true));
  }
  // A new payload receives a new key; an unchanged retry retains its key.
  form.addEventListener('input', () => { submissionId = crypto.randomUUID(); message(status, ''); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (demoMode) {
      message(status, 'Demostración: el formulario está completo. No se guardaron datos ni se enviaron correos.');
      form.reset(); return;
    }
    if (!navigator.onLine) { message(status, 'Necesitas conexión a internet para enviar. Tu texto continúa en este formulario.', true); return; }
    button.disabled = true; button.textContent = 'Enviando…';
    const data = new FormData(form);
    try {
      await invoke('submit-intention', {
        submissionId, name: data.get('name'), message: data.get('message'), kind: data.get('kind') || 'petition',
        consent: data.get('consent') === 'on', website: data.get('website') || '',
        token: widget ? window.turnstile?.getResponse(widget) : '',
      });
      form.reset(); submissionId = crypto.randomUUID();
      message(status, 'Recibimos tu intención. Nuestra comunidad la acompañará en oración.');
    } catch (error) { message(status, errorText(error), true); }
    finally {
      button.textContent = label;
      // Turnstile tokens are single-use. Every retry needs a fresh verification.
      if (widget) { window.turnstile?.reset(widget); button.disabled = true; }
      else button.disabled = false;
    }
  });
});
