# Validación del entorno de desarrollo

Comando ejecutado en `/workspace/Yeivt` después de reinstalar con el lockfile:

```sh
npm ci --ignore-scripts --cache /workspace/.npm-cache
CHROMIUM_PATH=/usr/bin/chromium npm run validate
```

Resultado:

- Comprobación de Astro/TypeScript del frontend y funciones: sin errores.
- 19 pruebas de servidor, PostgreSQL embebido y validación de metadatos de fotos: aprobadas, sin omisiones.
- Compilación estática: 13 páginas generadas.
- 9 pruebas en Chromium: aprobadas, sin omisiones; incluye la fuente Inter sin conexión y la lista de cuatro templos.
- Auditoría de dependencias de producción: sin vulnerabilidades reportadas en la ejecución.

Las pruebas cubren validación del formulario, consentimiento, captcha mediante mock, rechazo de orígenes ajenos, límite de tamaño de solicitudes, verificación de administradores, permisos anónimos y de miembros no aprobados, separación del correo, asignación/propiedad, finalización idempotente, devolución, límites por correo, bloqueos de envío, reintentos y eliminación de datos antiguos.

En navegador se comprobó el menú de nueve opciones, ausencia de desbordamiento horizontal y proporción de imágenes en anchos 320, 390, 768 y 1440, formulario de demostración, asignación y finalización en el panel, revisión administrativa, ajuste de letra y lectura de una oración sin conexión. Las rutas privadas y de API quedan fuera de CacheStorage.

Estas pruebas no utilizan un proyecto Supabase desplegado ni envían mensajes reales. Falta validar Auth, Turnstile real, SMTP, Resend, tareas programadas y el circuito entre dos cuentas en el entorno externo. Ver el checklist de `DEPLOYMENT.md`.

Capturas de interfaces en modo demostración:

- [Inicio en computadora](screenshots/inicio-desktop.png)
- [Inicio en celular](screenshots/inicio-movil.png)
- [Panel de sacerdotes](screenshots/panel-sacerdotes.png)
- [Templos marianos](screenshots/templos.png)

Las fotografías de Wikimedia siguen pendientes de descarga por el bloqueo de red; los metadatos se probaron con fixtures y la interfaz muestra ilustraciones provisionales. No se afirma una importación real de fotografías ni validación de licencias de archivos aún no descargados.
