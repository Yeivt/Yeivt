# Decisiones del proyecto

## Versión inicial

Nombre: **Misterio**, según las dos páginas aportadas de «Proyecto Misterio (abril 2026)».

La finalidad es acompañar una red de oración con peticiones y agradecimientos a María. El sitio no se presenta como página oficial de una institución. No incluye publicidad, recaudación, cobros, contactos directos entre participantes ni perfiles públicos.

El menú conserva exactamente nueve opciones, conforme a lo acordado: siete oraciones, Intenciones y Templos marianos. La galería aparece en el inicio sin añadir una opción. El acceso de sacerdotes y la solicitud están en el pie. La administración tiene acceso independiente protegido.

Se incluyeron Ave María, Salve, Rosario y Ángelus mencionados en el documento. Para completar siete se propusieron Bajo tu amparo, Acuérdate y Magníficat; se pueden reemplazar sin modificar la lógica del sistema. Todas requieren revisión pastoral y editorial.

La galería reserva los cuatro títulos indicados: Luján, Medalla Milagrosa, Lourdes y Fátima. La lista de templos contiene sus cuatro santuarios con mapas y sitios. Las fotografías se importan con fuente y licencia mediante `scripts/photos.mjs`; su descarga está pendiente porque Wikimedia permanece bloqueado en la red actual. Mientras tanto hay ilustraciones identificadas como provisionales. Los títulos y textos utilizan Inter alojada localmente, sin trazos finos ni cursiva.

## Intenciones y privacidad

Cada intención es una petición o un agradecimiento. El nombre acepta alias para reducir identificación, de acuerdo con el documento. El correo permanece separado de los datos visibles para quienes rezan. No hay publicación de intenciones, chat, perfiles personales ni posibilidad de contactar al solicitante desde el panel.

Estados: pendiente → asignada → completada. Solo quien la recibió puede completarla o devolverla a pendientes. Abrirla no la elimina. Queda visible para su responsable hasta marcarla como rezada. En ese momento se genera un único trabajo de confirmación, en la misma transacción de base de datos.

El documento no impone duración ni forma de intercesión y el sistema tampoco. La base admite el rol `intercessor` por si el responsable decide sumar laicos verificados. La aprobación implementada habilita sacerdotes por defecto; ampliar el registro a intercesores es una decisión posterior, no un registro público irrestricto.

## Envío de un único correo

Hay una restricción única por intención en la cola. Las peticiones repetidas de completar no agregan trabajos. El proveedor recibe siempre la misma clave de idempotencia para una misma intención, con cuerpo y remitente estables. Cada trabajo tiene una concesión temporal que evita ejecuciones simultáneas.

No existe una garantía universal de «exactamente una vez» entre dos servicios independientes si el proveedor deja de reconocer la clave después de un plazo. Por eso los reintentos automáticos se detienen a las 23 horas desde el primer intento o después de ocho intentos, dentro de la ventana de 24 horas documentada por Resend. Los trabajos ambiguos pasan a `review`. El responsable debe consultar la entrega del proveedor antes de decidir qué hacer; nunca reiniciar a ciegas un trabajo después de esa ventana. Revisar esta política si cambia el contrato del proveedor.

## Etapas futuras

- Testimonios: el documento los considera opcionales. Comenzar con texto moderado y consentimiento específico. No se implementa subida libre de audio o video: requiere almacenamiento, límites, moderación y política de retiro.
- Presentación y reflexiones sobre María: el inicio incluye una presentación breve. Incorporar material aprobado, atribuciones y enlaces autorizados antes de sumar videos.
- Sección sobre la mujer centrada en María: propuesta editorial futura. No se escribe material doctrinal definitivo sin revisión del responsable.
- Galería de alta resolución: reemplazar los SVG de ejemplo con originales autorizados para impresión y descargas separadas de las versiones livianas de la web.
- Intercesores laicos: ampliar la solicitud y definir quién verifica y aprueba a cada participante.

## Qué falta antes del lanzamiento

Configurar Supabase, Turnstile, dominio, remitente de correo, SMTP de acceso y tareas programadas. Probar el circuito completo con cuentas autorizadas y un destinatario de prueba controlado por el responsable. Completar privacidad y contenido, elegir región de datos, acordar retención y configurar respaldos. El prototipo local no equivale a un despliegue real validado.
