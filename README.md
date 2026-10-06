# Misterio

Web responsive y PWA para orar, compartir peticiones y agradecimientos y recibir una única confirmación cuando una intención se presenta en oración. Basada en el documento «Proyecto Misterio (abril 2026)» y el circuito acordado con el usuario. Sin publicidad, pagos ni perfiles públicos.

## Probar el proyecto

Requiere Node.js 22.12 o posterior y npm. Desde la raíz del repositorio:

```sh
npm ci --ignore-scripts
npm run dev
```

Sin configuración externa se inicia en **demostración**. Hay un aviso visible: los formularios no guardan datos ni envían correos. En el acceso de sacerdotes y en `/admin/` hay botones para explorar ejemplos ficticios. Estos ejemplos viven solo en memoria y se reinician al recargar.

```sh
npm run check
npm test
npm run build
npm run preview
```

La lectura sin conexión se prueba sobre la compilación con `preview`, no sobre el servidor de desarrollo. El service worker descarga las siete oraciones y sus recursos públicos después de la primera visita con conexión. Los formularios requieren internet y nunca se encolan offline.

Para las pruebas de navegador:

```sh
npx playwright install chromium
npm run test:e2e
```

En el entorno de nube hay un Chromium instalado: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Estas pruebas esperan una compilación en modo demostración. No envían correos reales.

## Qué está incluido

- Inicio con dos imágenes y sus textos, acceso a oraciones, galería descargable y formulario al final.
- Nueve opciones de menú: Ave María, Salve, Rosario, Ángelus, Bajo tu amparo, Acuérdate, Magníficat, Intenciones y Templos marianos.
- Siete páginas con imagen, oración, tamaño de texto ajustable y navegación anterior/siguiente.
- Peticiones y agradecimientos privados; se puede usar un alias.
- Panel autorizado con pendientes y «Mis intenciones asignadas». Las completadas desaparecen del panel.
- Asignación atómica en PostgreSQL para impedir que dos personas reciban una misma intención.
- Solicitud de acceso, aprobación manual y acceso mediante enlace de correo.
- Panel del responsable en `/admin/`. Conocer la dirección no concede permisos: el servidor verifica sesión y rol.
- Correos en una cola persistente con reintentos, exclusión entre trabajadores y clave de idempotencia.
- Caché offline limitada a páginas y recursos públicos, HTTPS en alojamiento y políticas de seguridad para Cloudflare Pages.

El único cuerpo del correo de confirmación es:

> Tu intención fue presentada a la Virgen en oración. Gracias por confiar tu petición a nuestra comunidad.

Se programa **al marcar como rezada**, no al abrir, asignar o enviar la intención. Supabase Auth envía sus propios mensajes de acceso a los miembros; no son confirmaciones de intenciones.

## Conectar la versión real

Para una prueba pública completa y el presupuesto, empezar por [docs/PRUEBA-PUBLICA.md](docs/PRUEBA-PUBLICA.md). Las instrucciones técnicas están en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Crear los servicios, elegir región y dominio y desplegar requiere las cuentas del responsable. No se han creado recursos externos ni publicado este sitio.

Copiar `.env.example` a `.env` sin sobrescribir configuración existente y establecer:

| Variable pública | Uso |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave pública/publishable o anon, nunca `service_role`. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Clave pública del widget antispam de Cloudflare. |
| `PUBLIC_DEMO_MODE` | `false` para funcionamiento real. |

Las variables públicas se incorporan al compilar. Hay que recompilar cuando cambian. Una compilación con `PUBLIC_DEMO_MODE=false` falla si faltan variables requeridas.

Las claves privadas de Supabase, Resend y Turnstile y la clave del trabajador se configuran **solo en las funciones de Supabase**, nunca en Astro ni en Cloudflare Pages.

## Contenido

Editar `src/content/site.ts` para modificar las siete oraciones o agregar templos reales. Es una selección inicial de textos tradicionales e instrucciones; requiere revisión pastoral. Las cuatro advocaciones propuestas por el documento son Luján, Medalla Milagrosa, Lourdes y Fátima.

Las imágenes se gestionan con `src/content/photos.json`, versiones WebP responsive y créditos visibles. El importador de [docs/PHOTOS.md](docs/PHOTOS.md) descarga fotografías de Wikimedia con autor y licencia compatible. Hasta completar la descarga, las ilustraciones SVG propias siguen identificadas como provisionales. No se incluyeron las fotos de las páginas del documento como imágenes devocionales. La tipografía Inter se aloja localmente y no requiere conexión a Google Fonts.

La lista incluye Luján, la Capilla de la Medalla Milagrosa en París, Lourdes y Fátima, con dirección de referencia, mapa y sitio del santuario. Confirmar accesos y horarios en cada sitio antes de visitar. La página de privacidad es un borrador y debe completarse con responsable, contacto, plazos aprobados y requisitos de la jurisdicción antes de publicar.

En [docs/PROJECT.md](docs/PROJECT.md) se registran decisiones, alcance y funciones futuras del documento.

## Organización

```text
src/content/          Oraciones, nombre y templos
src/pages/            Páginas públicas y paneles
src/scripts/          Formularios, autenticación y acciones
public/               Ilustraciones, iconos y PWA
supabase/migrations/  Tablas, permisos y transiciones
supabase/functions/   Formularios públicos, administración y correo
supabase/schedule.sql Tareas programadas de correo y eliminación
tests/                Pruebas de servidor, PostgreSQL y navegador
```

## Mantenimiento

Revisar entregas de correo, solicitudes de acceso y trabajos en estado `review`; activar respaldos acordes con el plan elegido y comprobar una restauración. Revisar periódicamente actualizaciones de dependencias. Al cambiar recursos públicos, incrementar la versión `CACHE` de `public/sw.js` para retirar recursos antiguos tras cerrar las pestañas previas.

Los avisos de entrega del proveedor pueden ayudar al responsable a detectar rebotes; aceptar una petición de envío no garantiza que llegue a la bandeja de entrada. No se agregan mensajes alternativos ni notificaciones repetidas al solicitante.
