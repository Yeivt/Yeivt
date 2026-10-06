// Curated import, not automatic selection: inspect subject and license first.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'src/content/photos.json');
const [action, ...args] = process.argv.slice(2);
const api = 'https://commons.wikimedia.org/w/api.php';
const ids = new Set(['virgen-lujan', 'virgen-milagrosa', 'virgen-lourdes', 'virgen-fatima', 'virgen-lujan-2', 'virgen-lourdes-2', 'virgen-fatima-2', 'templo-lujan', 'templo-milagrosa', 'templo-lourdes', 'templo-fatima']);
const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/\s+/g, ' ').trim();
async function query(params) {
  const url = new URL(api);
  for (const [key, value] of Object.entries({ action: 'query', format: 'json', ...params })) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { 'User-Agent': 'Misterio/0.1 (licensed devotional image import)' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Wikimedia respondió HTTP ${response.status}. Revisa el acceso de red.`);
  const result = await response.json();
  if (result.error) throw new Error(result.error.info || 'La consulta falló.');
  return Object.values(result.query?.pages || {});
}
export function metadata(page) {
  const info = page.imageinfo?.[0];
  if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime)) return null;
  const meta = info.extmetadata || {};
  const license = plain(meta.LicenseShortName?.value);
  const licenseUrl = (meta.LicenseUrl?.value || (license === 'Public domain' ? 'https://commons.wikimedia.org/wiki/Commons:Public_domain' : '')).replace(/^http:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//, 'https://$1/');
  const reusable = /^https:\/\/creativecommons\.org\/(licenses\/by(?:-sa)?\/|publicdomain\/(?:zero|mark)\/)/.test(licenseUrl) || (license === 'Public domain' && licenseUrl === 'https://commons.wikimedia.org/wiki/Commons:Public_domain');
  if (!reusable || !licenseUrl) return null;
  const url = new URL(info.url);
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org') throw new Error('Destino de imagen no permitido.');
  const source = new URL(info.descriptionurl);
  if (source.protocol !== 'https:' || source.hostname !== 'commons.wikimedia.org') throw new Error('Fuente de imagen no permitida.');
  return { title: page.title, author: plain(meta.Artist?.value || meta.Credit?.value), license, licenseUrl, sourceUrl: info.descriptionurl, originalUrl: info.url, width: info.width, height: info.height };
}

async function main() {
  if (action === 'help') {
    console.log('npm run photos -- search "Virgen de Luján"\nnpm run photos -- import virgen-lujan "File:TÍTULO_EXACTO.jpg"');
    return;
  }
  if (action === 'search' && args.length) {
    const pages = await query({ generator: 'search', gsrsearch: args.join(' '), gsrnamespace: '6', gsrlimit: '12', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata' });
    const candidates = pages.map(metadata).filter(Boolean).filter(photo => photo.width >= 800 && photo.author);
    console.log(JSON.stringify(candidates, null, 2));
    if (!candidates.length) throw new Error('No se encontraron imágenes grandes con licencia compatible. Prueba otra búsqueda.');
    return;
  }
  if (action !== 'import' || args.length !== 2 || !ids.has(args[0]) || !args[1].startsWith('File:')) {
    throw new Error('Uso: npm run photos -- search "Virgen de Luján"\nO: npm run photos -- import virgen-lujan "File:TÍTULO_EXACTO.jpg"');
  }
  const [id, title] = args;
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest[id]) throw new Error(`Ya existe ${id}. Conserva la importación o retírala expresamente del manifiesto antes de reemplazarla.`);
  const [page] = await query({ titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata' });
  const photo = metadata(page || {});
  if (!photo || !photo.author || photo.width < 800) throw new Error('Falta licencia/autor compatible o resolución suficiente. No se importó la imagen.');
  const response = await fetch(photo.originalUrl, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`No se pudo descargar la imagen: HTTP ${response.status}.`);
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 40 * 1024 * 1024) { await reader.cancel(); throw new Error('Original demasiado grande: límite 40 MB.'); } chunks.push(value); }
  const original = await sharp(Buffer.concat(chunks)).rotate().toBuffer();
  const decoded = await sharp(original).metadata();
  if (!decoded.width || !decoded.height) throw new Error('No se pudo verificar la fotografía.');
  const variants = [];
  for (const width of [...new Set([480, 800, Math.min(1200, decoded.width)])].filter(width => width <= decoded.width).sort((a,b) => a-b)) {
    const path = `/images/photos/${id}-${width}.webp`;
    const destination = resolve(root, `public${path}`);
    try { await access(destination); throw new Error(`Ya existe ${destination}. No se sobrescribirá.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await mkdir(dirname(destination), { recursive: true });
    await sharp(original).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toFile(destination);
    variants.push({ width, src: path });
  }
  const largest = variants.at(-1);
  const size = await sharp(resolve(root, `public${largest.src}`)).metadata();
  manifest[id] = { ...photo, src: largest.src, variants, width: size.width, height: size.height };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Importada ${id}: ${photo.author} · ${photo.license}. Se conservaron fuente y licencia.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
