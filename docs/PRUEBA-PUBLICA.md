# Prueba pública de Misterio

La versión actual requiere el despliegue descrito en [DEPLOYMENT.md](DEPLOYMENT.md). Reemplaza el circuito anterior de correo y aprobación.

Servicios necesarios: alojamiento estático Cloudflare ya existente, Supabase para PostgreSQL/Auth/Edge Functions y Turnstile para intenciones. No contratar ni configurar un proveedor de correo para las nuevas altas de Intercesor. Consultar precios y límites vigentes en las cuentas del responsable antes de elegir planes.

Primero probar el diseño en demostración, con sus mensajes ficticios identificados. Luego conectar un proyecto de prueba y ejecutar la lista de validación real de DEPLOYMENT.md. Cambiar a `PUBLIC_DEMO_MODE=false` solo cuando existan las variables públicas, funciones, migraciones, claves privadas del servidor y cron.

La URL publicada por el usuario es `https://yeivt.torrealbaviktor.workers.dev/`. Que exista una URL no confirma que esté conectada a una base de datos ni que tenga el último código. La activación debe comprobarse con envíos y cuentas ficticias de extremo a extremo.
