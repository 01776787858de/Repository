import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('inspect a public website and collect its visible links', async ({ page, baseURL, context }) => {
  const target = process.env.TARGET_URL || baseURL;
  if (!target) throw new Error('Provide TARGET_URL using the workflow input.');

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const popupUrls: string[] = [];
  const dialogs: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('popup', popup => {
    popupUrls.push(popup.url());
    void popup.close().catch(() => {});
  });
  page.on('dialog', dialog => {
    dialogs.push(dialog.type());
    void dialog.dismiss().catch(() => {});
  });

  let responseStatus: number | null = null;
  let title = '';
  let finalUrl = target;
  let brokenImages: string[] = [];
  let links: Array<{ text: string; url: string; sameOrigin: boolean }> = [];
  let navigationError: string | null = null;

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    responseStatus = response?.status() ?? null;
    finalUrl = page.url();
    title = await page.title();
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    links = await page.locator('a[href]').evaluateAll((anchors, origin) =>
      anchors.slice(0, 300).map(anchor => {
        const element = anchor as HTMLAnchorElement;
        let url = '';
        try { url = new URL(element.href, location.href).href; } catch {}
        return {
          text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 180),
          url,
          sameOrigin: (() => { try { return new URL(url).origin === origin; } catch { return false; } })()
        };
      }).filter(item => /^https?:\/\//i.test(item.url))
    , new URL(finalUrl).origin);

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
    collectedLinks: links,
    linkCount: links.length,
    sameOriginLinkCount: links.filter(link => link.sameOrigin).length,
    externalLinkCount: links.filter(link => !link.sameOrigin).length,
    popupUrls,
    dismissedDialogs: dialogs,
    consoleErrors,
    pageErrors,
    brokenImages,
    note: 'Collected anchor links without clicking them. No forms submitted, files downloaded, ad flows followed, or protections bypassed.'
  };

  await mkdir('reports', { recursive: true });
  await writeFile('reports/link-check-report.json', JSON.stringify(report, null, 2));

  console.log('LINK CHECK REPORT');
  console.log(JSON.stringify(report, null, 2));

  expect(navigationError, 'The browser must load the website').toBeNull();
  if (responseStatus !== null) expect(responseStatus, 'HTTP response should be successful').toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});
