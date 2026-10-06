import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`public navigation has nine choices and no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('en oración');
    await page.locator('#main-menu summary').click();
    const navigation = page.getByRole('navigation', { name: 'Menú principal' });
    await expect(navigation.getByRole('link')).toHaveCount(9);
    await navigation.getByRole('link', { name: 'Intenciones', exact: false }).click();
    await expect(page).toHaveURL(/#intenciones$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const image = await page.locator('.prayer-image img').first().boundingBox();
    expect(image).not.toBeNull();
    expect(image!.height / image!.width).toBeLessThan(1.5);
  });
}

test('demo form validates consent and never sends personal information', async ({ page }) => {
  let externalRequests = 0;
  page.on('request', request => { if (/supabase|resend/.test(request.url())) externalRequests++; });
  await page.goto('/');
  const form = page.locator('.public-form');
  await form.getByLabel('Nombre o alias').fill('Alias de prueba');
  await form.getByLabel('Correo electrónico').fill('example@example.com');
  await form.getByLabel('Tu intención', { exact: false }).fill('Una intención ficticia para comprobar el formulario.');
  await form.getByRole('button', { name: 'Enviar mi intención' }).click();
  await expect(form.getByRole('status')).toHaveText('');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Enviar mi intención' }).click();
  await expect(form.getByRole('status')).toContainText('No se guardaron datos');
  expect(externalRequests).toBe(0);
});

test('a priest claims, retains, and completes a demo intention', async ({ page }) => {
  await page.goto('/sacerdotes/');
  await page.getByRole('button', { name: 'Explorar el panel' }).click();
  const pending = page.locator('#pending-list'); const assigned = page.locator('#assigned-list');
  await expect(pending.locator('article')).toHaveCount(2);
  await pending.getByRole('button', { name: 'Recibir y leer intención' }).first().click();
  await expect(pending.locator('article')).toHaveCount(1);
  await expect(assigned.locator('article')).toHaveCount(1);
  await expect(assigned).toContainText('Pido una oración por mi familia');
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(assigned.locator('article')).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await assigned.getByRole('button', { name: 'Marcar como rezada' }).click();
  await expect(assigned.locator('article')).toHaveCount(0);
  await expect(page.locator('#dashboard-status')).toContainText('No se envió ningún correo');
});

test('admin approval is explicit and removes a reviewed demo request', async ({ page }) => {
  await page.goto('/admin/');
  await page.getByRole('button', { name: 'Explorar solicitudes ficticias' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Identidad verificada' }).click();
  await expect(page.locator('#access-requests')).toContainText('No hay solicitudes pendientes');
});

test('prayers work offline and private pages and submissions stay outside the PWA cache', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.goto('/oraciones/ave-maria/');
  await expect(page.locator('.prayer-text')).toContainText('Dios te salve');
  const before = await page.locator('.prayer-text').evaluate(element => getComputedStyle(element).fontSize);
  await page.getByRole('button', { name: 'Aumentar tamaño' }).click();
  const after = await page.locator('.prayer-text').evaluate(element => getComputedStyle(element).fontSize);
  expect(parseFloat(after)).toBeGreaterThan(parseFloat(before));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.prayer-text')).toContainText('Dios te salve');
  await context.setOffline(false);
  await page.goto('/sacerdotes/');
  const cachedPaths = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname);
    return paths;
  });
  expect(cachedPaths.some(path => path.startsWith('/sacerdotes') || path.startsWith('/admin') || path.includes('/functions/'))).toBe(false);
  expect(cachedPaths.some(path => path.endsWith('.woff2'))).toBe(true);
});

test('the Marian temples list has four places and usable map links', async ({ page }) => {
  await page.goto('/templos/');
  await expect(page.locator('.temple-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Basílica de Nuestra Señora de Luján' })).toBeVisible();
  for (const link of await page.getByRole('link', { name: 'Ver en el mapa' }).all()) {
    expect(await link.getAttribute('href')).toMatch(/^https:\/\/www\.google\.com\/maps\/search\//);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
