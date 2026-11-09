import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('inspect the supplied public website in Chromium', async ({ page, baseURL }) => {
  const target = process.env.TARGET_URL || baseURL;
  if (!target) throw new Error('Provide TARGET_URL using the workflow input.');

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  let responseStatus: number | null = null;
  let title = '';
  let finalUrl = target;
  let brokenImages: string[] = [];
  let navigationError: string | null = null;

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    responseStatus = response?.status() ?? null;
    finalUrl = page.url();
    title = await page.title();
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    brokenImages = await page.locator('img').evaluateAll(images =>
      images.filter(img => !(img as HTMLImageElement).complete || (img as HTMLImageElement).naturalWidth === 0)
        .map(img => (img as HTMLImageElement).src)
    );
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  const report = {
    checkedAt: new Date().toISOString(),
    requestedUrl: target,
    finalUrl,
    httpStatus: responseStatus,
    pageTitle: title,
    navigationError,
    consoleErrors,
    pageErrors,
    brokenImages,
    note: 'Automated inspection only. No forms submitted and no buttons clicked.'
  };

  await mkdir('reports', { recursive: true });
  await writeFile('reports/link-check-report.json', JSON.stringify(report, null, 2));

  console.log('LINK CHECK REPORT');
  console.log(JSON.stringify(report, null, 2));

  expect(navigationError, 'The browser must load the website').toBeNull();
  if (responseStatus !== null) expect(responseStatus, 'HTTP response should be successful').toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});
