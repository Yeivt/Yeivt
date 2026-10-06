# Publicar una prueba completa y calcular sus costos

## Presupuesto

Para un único proyecto pequeño, con el backend actual y las imágenes servidas por Cloudflare Pages:

| Componente | Prueba con planes gratuitos | Producción inicial |
| --- | ---: | ---: |
| Cloudflare Pages, HTTPS y subdominio | US$0/mes | US$0/mes |
| Turnstile | US$0/mes | US$0/mes |
| Supabase | US$0/mes, dentro del plan Free | Desde US$25/mes, un proyecto Micro |
| Resend, dentro de su cupo gratuito | US$0/mes | US$0/mes mientras alcance el cupo |
| Dominio para envío de correo | Presupuestar US$15/año | Presupuestar US$15/año |

Con ese dominio de referencia:

- **Prueba completa:** US$0 al mes + US$15 de dominio al año = **US$15 el primer año**.
- **Producción inicial:** US$25 × 12 + US$15 = **US$315 al año**. Equivalente a US$26,25/mes.
- **Con correo de pago:** reservando aproximadamente US$20/mes adicionales para Resend, **US$555 al año**. Equivalente a US$46,25/mes.

El precio real del dominio depende de extensión, proveedor, promociones y renovación. Si ya tienes un dominio que puedes verificar para correo, su costo incremental puede ser cero. El precio de Resend de pago es una referencia no verificada en esta ejecución. Revisar [sus planes](https://resend.com/pricing) antes de contratar.

Estos totales son infraestructura estimada: no incluyen impuestos, conversión de moneda, trabajo de desarrollo o mantenimiento contratado, adicionales ni consumos fuera de cuota. Supabase Pro parte de US$25 para un proyecto Micro; proyectos extra o mayor cómputo aumentan el costo. No contratar complementos como dominio personalizado de la API o recuperación a un punto en el tiempo para esta prueba si no son necesarios.

Fuentes consultadas: [planes en el repositorio oficial de Supabase](https://github.com/supabase/supabase/blob/22cdd054925fe033c13a4531e784155f657bc74d/packages/shared-data/plans.ts), [precio de archivos estáticos de Cloudflare Pages](https://developers.cloudflare.com/pages/functions/pricing/#static-asset-requests) y [Turnstile](https://developers.cloudflare.com/turnstile/plans/). Las webs de precios no fueron accesibles desde este entorno; Cloudflare y Supabase se comprobaron en sus repositorios oficiales de GitHub. Confirmar las condiciones del checkout antes de pagar.

## Qué significa probar todas las funcionalidades

La demostración permite ver las interfaces y simular asignaciones, pero no persiste intenciones ni envía correos. Una prueba completa necesita base de datos, funciones, Auth, antispam y correo configurados, con `PUBLIC_DEMO_MODE=false`.

No hay un único servicio que active todo por subir este repositorio. Cloudflare aloja la web; Supabase resuelve base de datos, acceso y funciones; Resend resuelve entrega de correo. Se puede probar la aplicación completa con esos tres planes gratuitos y un dominio verificado, dentro de sus límites.

Para mostrar solo el diseño, no necesitas comprar un dominio: basta la dirección `*.pages.dev` gratuita de Cloudflare. Para enviar correo a sacerdotes y solicitantes distintos, el dominio de envío verificado es la opción recomendada. El remitente de prueba de Resend solo permite destinatarios restringidos; el SMTP integrado de Supabase también tiene restricciones. No equivalen a una prueba abierta de toda la comunidad.

## 1. Crear una web de prueba en Cloudflare Pages

Crear cuenta Cloudflare y conectar el repositorio GitHub `Yeivt/Yeivt` a un proyecto Pages de prueba. Elegir rama `main` y raíz del repositorio.

```text
Build command: npm run build
Build output directory: dist
NODE_VERSION: 24
PUBLIC_DEMO_MODE: true
```

Publicar para obtener una dirección estable `https://NOMBRE_ELEGIDO.pages.dev`. Registrar la dirección real, no usar este marcador literalmente. Por ahora es una demostración pública.

Usar esta dirección estable en toda la configuración siguiente. Los enlaces de preview de cada commit pueden cambiar y no son un buen origen para Auth/Turnstile. Las actualizaciones que se suban a la rama conectada volverán a desplegar la web automáticamente.

## 2. Crear el backend de prueba

Crear un proyecto **Supabase Free** exclusivo para ensayo. Elegir región. Aplicar las dos migraciones de `supabase/migrations/` y desplegar `submit-intention`, `request-access`, `admin-access` y `process-emails`, según [DEPLOYMENT.md](DEPLOYMENT.md).

Usar datos ficticios y correos que controles en esta prueba. Supabase Free puede pausarse tras una semana de inactividad y no ofrece las mismas garantías de respaldo que Pro. No usarlo como archivo permanente de intenciones reales sin definir respaldo y operación.

## 3. Configurar correo y verificación

1. Registrar o reutilizar un dominio bajo tu control.
2. Crear Resend, agregar el dominio y cargar los registros DNS que indique. El sitio puede seguir en `pages.dev`; el dominio propio se usa para el remitente.
3. Configurar el SMTP personalizado de Supabase Auth con los datos que muestre Resend. Esto permite invitaciones y enlaces de acceso. Las confirmaciones de intenciones usan la API de Resend, no ese SMTP.
4. Crear Turnstile y autorizar el hostname estable de Pages, sin `https://` ni rutas.
5. En los secretos de Supabase Edge Functions cargar `APP_ORIGIN` con el origen de Pages sin barra final, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `MAIL_FROM` y un `MAIL_WORKER_SECRET` aleatorio largo. No enviar sus valores por chat ni ponerlos en GitHub.
6. En Supabase Auth establecer la URL del sitio y permitir solo las redirecciones `/admin/` y `/sacerdotes/` de ese origen. Mantener las altas públicas deshabilitadas.
7. Crear el primer administrador y ejecutar la inserción de membresía de [DEPLOYMENT.md](DEPLOYMENT.md).
8. Crear los dos secretos Vault y ejecutar `supabase/schedule.sql` para procesar correos y limpiar datos.

Verificar los cupos del plan gratuito de correo y la disponibilidad de SMTP al contratar. Los correos de acceso también consumen cupo de envío. En la prueba no usar claves antispam que acepten cualquier solicitud si se abre el sitio a otras personas.

## 4. Conectar Cloudflare con el backend

En las variables del build del proyecto Pages:

```text
PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=CLAVE_PUBLICA
PUBLIC_TURNSTILE_SITE_KEY=CLAVE_PUBLICA_DEL_WIDGET
PUBLIC_DEMO_MODE=false
```

Recompilar y publicar. Las claves públicas son aptas para el navegador; las privadas permanecen exclusivamente en Supabase. No agregar `SUPABASE_SERVICE_ROLE_KEY` ni `RESEND_API_KEY` al frontend.

## 5. Recorrer el circuito completo

1. Entrar a `/sacerdotes/solicitar/` y enviar una solicitud con identidad de prueba.
2. Entrar como administrador en `/admin/`, verificar y aprobar. Comprobar la invitación por correo y que la cuenta pueda acceder.
3. Enviar una petición desde el inicio, usando otro correo controlado y un texto ficticio.
4. Entrar con dos cuentas aprobadas e intentar recibir esa misma petición: debe quedar para una sola.
5. Recargar el panel del propietario y comprobar que sigue en «Mis intenciones asignadas».
6. Marcar como rezada y comprobar que deja de aparecer. El cron debe procesar el trabajo de correo.
7. Verificar el correo recibido con el texto único acordado y el estado `sent` en `email_jobs`. Repetir la acción no debe generar otro trabajo.
8. Repetir con un agradecimiento. Comprobar también rechazo de solicitudes y denegación a cuentas no aprobadas.
9. Abrir una oración con conexión, instalar la PWA donde el navegador lo permita y comprobar su lectura sin conexión. Formularios y paneles privados requieren internet.

El proyecto no se anuncia como conectado hasta completar ese recorrido. Los tests locales no validan por sí solos la configuración de las cuentas externas.

## Pasar a producción

Completar los datos del responsable y privacidad, revisar textos e imágenes/licencias y acordar respaldo y retención. Para la versión pública estable conviene pasar el proyecto a Supabase Pro y activar controles de gasto. Si se cambia el dominio del sitio, actualizar `APP_ORIGIN`, Auth, Turnstile y volver a compilar. La autenticación, el correo y las intenciones no requieren contratar un servidor dedicado.
