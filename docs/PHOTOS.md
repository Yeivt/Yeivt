# Fotografías y atribuciones

Las fotografías deben descargarse de fuentes con licencia que permita publicar y adaptar la imagen. Esta versión incorpora un importador de Wikimedia Commons. No se asume que una foto encontrada en internet sea reutilizable.

La selección actual incluye **11 fotografías reales de Wikimedia Commons**: siete imágenes devocionales para las oraciones y cuatro de los santuarios. Se sirven desde el propio sitio en 33 versiones WebP de 480, 800 y 1200 píxeles, sin ampliar los originales. `src/content/photos.json` conserva para cada foto el autor, la licencia, la fuente, la URL original y un texto alternativo que identifica el motivo. Las ilustraciones propias permanecen como respaldo si falta una fotografía.

La imagen principal de Luján muestra la imagen de la iglesia de Nuestra Señora de Pompeya, fotografiada por Rodrigo Fernández (CC BY-SA 4.0). La fotografía de la réplica realizada por Photo-Monique permanece en la primera oración y en la galería; ninguna se presenta como la imagen original de la basílica. La Medalla Milagrosa está representada por una estatua en Columbus, Ohio, fotografiada por Nheyob. Las imágenes de Lourdes muestran la gruta de Massabielle. Las de Fátima conservan las identificaciones de sus páginas de origen. Las fotografías de templos corresponden a Luján, la capilla de la rue du Bac en París, Lourdes y Fátima.

Los textos breves de los santuarios están en `src/content/site.ts`, junto con sus direcciones y enlaces oficiales. Describen su ubicación, devoción y espacios de oración; los horarios se consultan en el sitio de cada santuario.

## Importar una fotografía

Desde una máquina con acceso a Wikimedia y Node.js 24.5 o posterior:

```sh
npm ci --ignore-scripts
npm run photos -- search "Virgen de Luján"
```

La búsqueda muestra candidatos con título `File:...`, URL original, autor, licencia y resolución. Abrir la fuente y verificar visualmente que representa la advocación o el templo correcto. Después:

```sh
npm run photos -- import virgen-lujan "File:TÍTULO_EXACTO_DE_LA_FOTO.jpg"
npm run build
```

No usar el título de ejemplo literalmente. El importador acepta JPEG, PNG y WebP con CC BY, CC BY-SA, CC0 o dominio público reconocido. Rechaza licencias incompatibles, URLs de descarga ajenas a Wikimedia, imágenes pequeñas y originales mayores de 40 MB. Conserva autor, fuente y licencia; nunca reemplaza una importación existente silenciosamente.

Genera versiones WebP de 480, 800 y hasta 1200 píxeles de ancho, sin ampliar el original. Las páginas eligen por `srcset` el tamaño apropiado y muestran los créditos. Las copias se sirven desde el mismo sitio, sin depender de Wikimedia al navegar. Las fuentes de alta resolución siguen accesibles desde «Ver original y licencia».

IDs disponibles:

| ID | Imagen |
| --- | --- |
| `virgen-lujan` | Virgen de Luján, primera oración/galería |
| `virgen-milagrosa` | Medalla Milagrosa |
| `virgen-lourdes` | Lourdes |
| `virgen-fatima` | Fátima |
| `virgen-lujan-2` | Fotografía de Luján, imagen principal del inicio/quinta oración |
| `virgen-lourdes-2` | Segunda fotografía de Lourdes, sexta oración |
| `virgen-fatima-2` | Segunda fotografía de Fátima, séptima oración |
| `templo-lujan` | Basílica de Nuestra Señora de Luján |
| `templo-milagrosa` | Capilla de la Medalla Milagrosa, París |
| `templo-lourdes` | Santuario de Lourdes |
| `templo-fatima` | Santuario de Fátima |

La selección es manual para evitar atribuir una imagen a un lugar o advocación incorrectos. Tras importar, comprobar el encuadre en inicio, tarjetas y páginas; la foto se adapta visualmente a cada espacio sin modificar su archivo original. Subir los WebP y `photos.json` a GitHub y recompilar para publicar.

Las licencias pueden exigir atribución y compartir las adaptaciones bajo la misma licencia. Los créditos visibles y el manifiesto deben acompañar a las fotografías. El enlace al original explica su licencia también para quien vaya a imprimir o reutilizarlo.
