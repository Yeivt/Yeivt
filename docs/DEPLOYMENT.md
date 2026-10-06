# Conectar y publicar Misterio

Estos pasos son para el responsable del proyecto. El repositorio se puede desarrollar y probar sin cuentas externas en modo demostración. No introducir credenciales en conversaciones, commits o variables públicas.

## 1. Proyecto Supabase y base de datos

Crear un proyecto Supabase en la región elegida para los usuarios y las obligaciones de datos. Aplicar, en orden, ambos archivos de `supabase/migrations/` desde el editor SQL, o usar Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
```

Los permisos usan RLS. Los visitantes no pueden consultar tablas ni ejecutar RPC de inserción. Los miembros aprobados solo pueden consultar su membresía y las intenciones pendientes o asignadas a ellos. No tienen acceso a `intention_contacts`, `email_jobs` ni `access_requests`. Las escrituras pasan por funciones transaccionales con permisos específicos.

No desactivar RLS ni colocar `service_role` en el frontend. La identidad de un miembro se toma de la sesión autenticada, no de un ID que mande el navegador.

## 2. Antispam y dominio

Crear un widget Cloudflare Turnstile para el dominio final. Guardar la clave pública en `PUBLIC_TURNSTILE_SITE_KEY` y la privada en los secretos de las funciones. Los formularios verifican el token en el servidor, su acción y hostname. Hay además límite transaccional de tres intenciones por correo por hora y una solicitud de acceso por correo por día.

`APP_ORIGIN` debe ser el origen HTTPS exacto del sitio, sin barra final, por ejemplo `https://misterio.example`. Cada despliegue de prueba real necesita un origen configurado propio; no se permite cualquier origen. Las demostraciones de Cloudflare Pages pueden mantenerse sin backend real.

## 3. Correos

Crear una cuenta Resend, verificar el dominio de envío con los registros DNS que indique el proveedor y configurar el remitente estable, por ejemplo `Misterio <oracion@TU_DOMINIO>`.

Configurar **también** un SMTP propio en Supabase Auth para invitaciones y enlaces de acceso. El SMTP de prueba integrado de Supabase tiene restricciones y no sirve como configuración general de producción. Resend puede ser ese proveedor SMTP si el plan elegido lo permite. Los correos de Auth y los de intenciones cumplen funciones distintas.

En Supabase Authentication configurar la URL del sitio y permitir exclusivamente las redirecciones de acceso:

```text
https://TU_DOMINIO/sacerdotes/
https://TU_DOMINIO/admin/
```

Deshabilitar altas públicas de usuarios en Auth. La aplicación llama a `signInWithOtp` con `shouldCreateUser: false`; las cuentas se habilitan por administración. Aunque exista una cuenta Auth, no puede leer intenciones hasta tener membresía aprobada. Mantener rate limits de Auth y, si corresponde, su protección antispam para enlaces de acceso.

## 4. Secretos de las funciones

En Supabase → Edge Functions → Secrets configurar:

| Nombre | Contenido |
| --- | --- |
| `APP_ORIGIN` | Origen HTTPS del sitio, sin barra final. |
| `TURNSTILE_SECRET_KEY` | Clave privada del widget. |
| `RESEND_API_KEY` | Clave del proveedor de correo. |
| `MAIL_FROM` | Remitente verificado, estable durante los reintentos. |
| `MAIL_WORKER_SECRET` | Secreto aleatorio largo para la tarea de correo. |

Supabase suministra `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` al entorno de funciones. No se declaran como variables públicas ni se copian al sitio. Para probar funciones fuera de Supabase deben suministrarse por un mecanismo local seguro.

Desplegar las cuatro funciones; `supabase/config.toml` declara las rutas públicas y la validación implementada dentro de los handlers:

```sh
npx supabase functions deploy submit-intention
npx supabase functions deploy request-access
npx supabase functions deploy admin-access
npx supabase functions deploy process-emails
```

`admin-access` valida el JWT contra Auth y consulta un rol `admin` aprobado actual antes de usar acceso privilegiado. `process-emails` exige el secreto del trabajador y no admite invocación desde el frontend. No poner ese secreto en código o URLs públicas.

## 5. Primer administrador

Crear o invitar la cuenta del responsable desde Supabase Authentication. Copiar su UUID y ejecutar en el editor SQL:

```sql
insert into public.members(user_id, display_name, role, approved)
values ('UUID_DEL_RESPONSABLE', 'Responsable de Misterio', 'admin', true);
```

Ingresar en `/admin/` mediante enlace de correo. Las solicitudes se revisan manualmente. Aprobar invita al correo verificado y crea la membresía; rechazar no habilita ninguna cuenta. Si una invitación quedó a medias, volver a aprobar recupera la cuenta por su correo y completa la transacción. Para reenviar una invitación fallida, usar Authentication o un nuevo enlace de acceso después de aprobar. Una membresía existente deshabilitada no se reactiva automáticamente: revisarla expresamente.

Para retirar acceso: establecer `approved = false` en la membresía. Si la persona tenía intenciones asignadas, el responsable puede devolverlas a pendientes desde SQL, conservando coherencia de estado. No eliminar un usuario con asignaciones antes de resolverlas.

## 6. Tareas programadas

En Supabase Vault crear mediante su interfaz segura:

- `misterio_function_url`: URL completa de la función `process-emails`.
- `misterio_mail_worker_secret`: el mismo valor privado de `MAIL_WORKER_SECRET`.

Después ejecutar `supabase/schedule.sql`. Registra un procesamiento de correo cada minuto y una limpieza diaria. No escribir valores privados dentro de ese archivo. Activar los módulos Cron/pg_cron, pg_net y Vault si el proyecto todavía no los tiene disponibles.

Los trabajos de correo tienen un bloqueo de cinco minutos, reintento exponencial y máximo de ocho intentos. Tras 23 horas desde el primer intento pasan a revisión para evitar repetir entregas fuera de la ventana de idempotencia. Los estados `review` requieren comprobar el proveedor, no reiniciar automáticamente.

Los plazos de eliminación propuestos son 90 días tras completar y 180 días para pendientes/asignadas y solicitudes. Aprobarlos con el responsable antes de activar la tarea y reflejarlos en privacidad. Las copias de seguridad pueden conservar datos por otros plazos: acordarlos con el plan y las condiciones del proveedor.

## 7. Publicar el frontend

En Cloudflare Pages conectar el repositorio cuando se haya subido a GitHub. Elegir:

```text
Build command: npm run build
Output directory: dist
Node.js: 24 o una versión compatible >=22.12
```

Variables del build:

```text
PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=CLAVE_PUBLICA
PUBLIC_TURNSTILE_SITE_KEY=CLAVE_PUBLICA_DEL_WIDGET
PUBLIC_DEMO_MODE=false
```

Las únicas claves aquí son públicas. Configurar dominio y HTTPS. El archivo `_headers` contiene las cabeceras de seguridad y permite las conexiones a proyectos `*.supabase.co`. Si se utiliza un dominio personalizado de Supabase, sustituir esos hosts por el destino concreto en la política CSP.

Publicar el entorno de desarrollo de Codex es independiente de publicar este sitio en internet. Ninguna de esas operaciones se realiza simplemente guardando scripts de configuración.

## 8. Validación real antes del lanzamiento

1. Revisar contenido, imágenes/licencias y completar contacto de privacidad.
2. Crear un administrador y dos cuentas de sacerdotes de prueba autorizadas.
3. Enviar una petición y un agradecimiento desde formularios con Turnstile real.
4. Comprobar que una cuenta anónima o sin aprobar no puede consultar intenciones, correos ni ejecutar transiciones.
5. Intentar recibir la misma petición con los dos sacerdotes: solo uno debe obtenerla.
6. Recargar el panel del propietario: debe conservar la asignación. El otro no debe verla.
7. Completar y repetir la acción: debe existir un único trabajo y recibirse un único correo con el texto aprobado.
8. Verificar el estado `sent`, revisar la entrega en Resend y comprobar que las completadas desaparecen.
9. Comprobar reintentos con un proveedor de prueba o entorno de ensayo; no reenviar a personas reales para probar fallos.
10. Confirmar ejecución del cron y los plazos de eliminación; configurar y probar respaldos.
11. Instalar en un dispositivo compatible y abrir una oración sin conexión. Revisar que las páginas privadas no estén en CacheStorage.

Los tests locales usan PostgreSQL embebido (PGlite), mocks del proveedor y un navegador real. No reemplazan esta prueba del servicio desplegado, Auth, SMTP, Turnstile o entregas de correo reales.
