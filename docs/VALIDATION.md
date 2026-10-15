# Validación — rediseño e Intercesor

Ejecutado sobre Node.js 24 y Chromium local:

```sh
npm run check
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

- Astro y TypeScript del sitio y las funciones: sin errores ni advertencias.
- 20 casos de servidor, PostgreSQL embebido y metadatos de fotos: aprobados (9 de servidor, 9 de base y 2 de fotos).
- Compilación estática de 15 páginas: aprobada.
- 11 pruebas de Chromium: aprobadas. Vista en 320, 390, 768 y 1440px, formulario sin correo, consentimiento, solapas con teclado, lectura y relectura sin duplicar contador, filtros, registro no enlazado, usuarios sin espacios, recuperación y oraciones offline.
- Revisión visual en escritorio y móvil, sin errores de JavaScript en el recorrido de captura.

La prueba de migración parte de mensajes pendientes, asignados y completados, con contactos y correos en cola en el esquema anterior. Comprueba la conservación de mensajes, conversión de lecturas, inicialización de totales y retirada de la cola. Se prueban también permisos anónimos y de cuentas no habilitadas, imposibilidad de borrar o modificar directamente, límites sin correo, retención desde primera lectura, persistencia de contadores y reserva/rotación de códigos de recuperación.

Las pruebas de servidor usan adaptadores simulados para Auth y Turnstile; el SQL se ejecuta en PGlite. Las pruebas del navegador usan el modo demostración identificado. No equivalen a desplegar ni validar el proyecto Supabase real: quedan por comprobar Auth, encabezados de red, Turnstile, cron y dos sesiones reales siguiendo [DEPLOYMENT.md](DEPLOYMENT.md).

Capturas de la versión nueva en demostración:

- [Inicio de escritorio](screenshots/inicio-desktop.png)
- [Inicio móvil](screenshots/inicio-movil.png)
- [Bandeja de Intercesor](screenshots/panel-intercesor.png)

Las capturas no incluyen usuarios ni intenciones reales. Las fotografías de las páginas internas se conservan. Las capturas antiguas de otras pantallas permanecen como historial y no describen el nuevo panel.
