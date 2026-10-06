# Fotografías y atribuciones

Las fotografías deben descargarse de fuentes con licencia que permita publicar y adaptar la imagen. Esta versión incorpora un importador de Wikimedia Commons. No se asume que una foto encontrada en internet sea reutilizable.

El entorno de Codex bloqueó conexiones a `commons.wikimedia.org` y `upload.wikimedia.org`. Los dominios se añadieron al borrador de configuración, pero guardar el borrador no aplica la política al proceso actual. Hasta habilitar ese acceso y completar la importación, `src/content/photos.json` permanece vacío y las páginas muestran ilustraciones expresamente identificadas como provisionales. **Todavía no se descargaron fotografías reales.**

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
| `virgen-lujan` | Virgen de Luján, inicio/primera oración/galería |
| `virgen-milagrosa` | Medalla Milagrosa |
| `virgen-lourdes` | Lourdes |
| `virgen-fatima` | Fátima |
| `virgen-lujan-2` | Segunda fotografía de Luján, quinta oración |
| `virgen-lourdes-2` | Segunda fotografía de Lourdes, sexta oración |
| `virgen-fatima-2` | Segunda fotografía de Fátima, séptima oración |
| `templo-lujan` | Basílica de Nuestra Señora de Luján |
| `templo-milagrosa` | Capilla de la Medalla Milagrosa, París |
| `templo-lourdes` | Santuario de Lourdes |
| `templo-fatima` | Santuario de Fátima |

La selección es manual para evitar atribuir una imagen a un lugar o advocación incorrectos. Tras importar, comprobar el encuadre en inicio, tarjetas y páginas; la foto se adapta visualmente a cada espacio sin modificar su archivo original. Subir los WebP y `photos.json` a GitHub y recompilar para publicar.

Las licencias pueden exigir atribución y compartir las adaptaciones bajo la misma licencia. Los créditos visibles y el manifiesto deben acompañar a las fotografías. El enlace al original explica su licencia también para quien vaya a imprimir o reutilizarlo.
