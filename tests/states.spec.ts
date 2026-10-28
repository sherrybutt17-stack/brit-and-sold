// Screenshots of interactive states (menus, dialogs, errors, empty results) for visual review.
// Run with: npx playwright test tests/states.spec.ts  (images land in test-results/states/)
import { test } from '@playwright/test';

const shot = (name: string, project: string) => `test-results/states/${project}-${name}.png`;

test('interactive states', async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const mobile = (page.viewportSize()?.width ?? 1440) < 1024;
  await page.emulateMedia({ reducedMotion: 'reduce' });

  if (mobile) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.screenshot({ path: shot('menu-open', p) });
    await page.keyboard.press('Escape');

    await page.goto('/businesses');
    await page.locator('[data-filters-toggle]').click();
    await page.getByLabel('Industry', { exact: true }).selectOption('Manufacturing');
    await page.locator('#filters').scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('filters-open', p), fullPage: false });
  }

  await page.goto('/businesses?industry=Manufacturing&state=TX');
  await page.locator('[data-results-empty]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot('filtered-empty', p) });

  await page.goto('/businesses?preview=loading');
  await page.locator('[data-results-loading]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot('loading', p) });

  await page.goto('/businesses/sample-precision-machining-ohio');
  await page.getByRole('button', { name: 'Register interest' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.screenshot({ path: shot('dialog-errors', p) });

  await page.goto('/sell#inquiry');
  await page.locator('[data-seller-form]').getByRole('button', { name: 'Continue' }).click();
  await page.screenshot({ path: shot('form-errors', p) });
});
