// Full-page screenshots of every main route, for visual review.
// Run with: npx playwright test tests/screens.spec.ts  (images land in test-results/screens/)
import { test } from '@playwright/test';

const pages = [
  ['home', '/'],
  ['businesses', '/businesses'],
  ['listing', '/businesses/sample-residential-hvac-central-texas'],
  ['sell', '/sell'],
  ['about', '/about'],
];

for (const [name, path] of pages) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path, { waitUntil: 'networkidle' });
    // Scroll through the page so lazy-loaded images load before the capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await document.fonts.ready;
    });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-${name}.png`, fullPage: true });
  });
}
