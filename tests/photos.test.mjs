import test from 'node:test';
import assert from 'node:assert/strict';
import { metadata } from '../scripts/photos.mjs';

const page = () => ({ title: 'File:Example.jpg', imageinfo: [{ mime: 'image/jpeg', width: 1600, height: 2000, url: 'https://upload.wikimedia.org/wikipedia/commons/example.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg', extmetadata: { Artist: { value: '<a>Autor &amp; autora</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' } } }] });
test('photo imports preserve author, license and original source', () => {
  const result = metadata(page());
  assert.equal(result.author, 'Autor & autora');
  assert.equal(result.license, 'CC BY-SA 4.0');
  assert.equal(result.sourceUrl, 'https://commons.wikimedia.org/wiki/File:Example.jpg');
});
test('photo imports reject incompatible licenses and destinations', () => {
  const copyrighted = page();
  copyrighted.imageinfo[0].extmetadata.LicenseUrl.value = 'https://creativecommons.org/licenses/by-nc/4.0/';
  assert.equal(metadata(copyrighted), null);
  const forged = page(); forged.imageinfo[0].url = 'https://foreign.example/image.jpg';
  assert.throws(() => metadata(forged), /Destino/);
  const svg = page(); svg.imageinfo[0].mime = 'image/svg+xml'; assert.equal(metadata(svg), null);
});
