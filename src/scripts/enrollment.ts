import { demoMode, errorText, invoke, message } from '../lib/client';
const page=document.querySelector<HTMLElement>('[data-enrollment]')!;
const action=page.dataset.enrollment!;
const form=document.querySelector<HTMLFormElement>('#enrollment-form')!;
const status=document.querySelector<HTMLElement>('#enrollment-status');
// The invitation key lives in a URL fragment: it is never in HTTP requests,
// referrers, server access logs or the public application bundle.
let secret='';
function invitation(){
  secret=new URLSearchParams(location.hash.slice(1)).get('clave')||'';
  history.replaceState(null,'',location.pathname);
  const linkStatus=document.querySelector<HTMLElement>('#enrollment-link-status')!;
  form.hidden=!secret;
  linkStatus.textContent=secret?'No hace falta aprobación ni verificación por correo.':'Necesitás el enlace de invitación que te compartió la comunidad para crear tu cuenta.';
}
if(action==='register'){
  invitation();
  window.addEventListener('hashchange',invitation);
}
let savedUsername='',savedCode='';
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form);
  if(data.get('password')!==data.get('confirm')){message(status,'Las contraseñas no coinciden.',true);return;}
  if(demoMode){message(status,'Demostración: el servicio todavía no está conectado. No se creó una cuenta ni se cambió ninguna contraseña.');return;}
  const button=form.querySelector<HTMLButtonElement>('button[type=submit]')!;button.disabled=true;message(status,'Procesando…');
  try{
    const result=await invoke<{username:string;recoveryCode:string}>('intercessor-auth',{action,username:data.get('username'),password:data.get('password'),...(action==='register'?{secret}:{code:data.get('code')})});
    savedUsername=result.username;savedCode=result.recoveryCode;
    document.querySelector('#enrollment-user')!.textContent=savedUsername;
    document.querySelector('#recovery-code')!.textContent=savedCode;
    form.reset();form.hidden=true;document.querySelector<HTMLElement>('#enrollment-success')!.hidden=false;
    const title=document.querySelector<HTMLElement>('#enrollment-success-title')!;title.tabIndex=-1;title.focus();message(status,'');
    const linkStatus=document.querySelector<HTMLElement>('#enrollment-link-status');if(linkStatus)linkStatus.hidden=true;
  }catch(error){message(status,errorText(error),true);}finally{button.disabled=false;}
});
document.querySelector('#download-recovery')!.addEventListener('click',()=>{
  const blob=new Blob([`Misterio — Recuperación de Intercesor\nUsuario: ${savedUsername}\nCódigo: ${savedCode}\n\nGuardalo en un lugar privado. Usarlo invalida el código anterior.\n`],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='misterio-codigo-recuperacion.txt';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
