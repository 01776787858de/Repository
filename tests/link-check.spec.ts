import { test, expect } from '@playwright/test';

test('open the supplied URL and report basic page information', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Set TARGET_URL to the URL you want to check.');

  const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('URL:', page.url());
  console.log('HTTP status:', response?.status() ?? 'No response status');
  console.log('Page title:', await page.title());

  await expect(page.locator('body')).toBeVisible();
});
