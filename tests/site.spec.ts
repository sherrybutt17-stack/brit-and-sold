// Functional, accessibility and privacy checks. Run after `npm run build`: npx playwright test
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SAMPLE_LISTINGS } from '../src/data/listings';

const ROUTES = ['/', '/businesses', '/sell', '/about', `/businesses/${SAMPLE_LISTINGS[0].slug}`];

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

async function visibleCards(page: Page) {
  return page.locator('[data-listing]:visible').count();
}

/** On small screens the directory filters live in a collapsed panel. */
async function openFilters(page: Page) {
  if (!isMobile(page)) return;
  const toggle = page.locator('[data-filters-toggle]');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

test.describe('pages', () => {
  for (const route of ROUTES) {
    test(`${route} renders with one h1, no console errors and no horizontal scroll`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test(`${route} has no serious or critical axe violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }

  test('every internal link resolves', async ({ page, request }) => {
    const hrefs = new Set<string>();
    for (const route of ROUTES) {
      await page.goto(route);
      for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
        hrefs.add(href.split('#')[0] || '/');
      }
    }
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test('404 page is served for unknown routes', async ({ page }) => {
    const res = await page.goto('/no-such-page');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('couldn’t find');
  });
});

test.describe('navigation', () => {
  test('main navigation reaches all four pages', async ({ page }) => {
    await page.goto('/');
    if (isMobile(page)) {
      const toggle = page.getByRole('button', { name: 'Menu', exact: true });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const menu = page.getByRole('dialog', { name: 'Site menu' });
      await expect(menu).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await menu.getByRole('link', { name: 'Sell Your Business' }).click();
    } else {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sell Your Business' }).click();
    }
    await expect(page).toHaveURL(/\/sell$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Selling your business');

    for (const [label, url] of [
      ['Browse Businesses', /\/businesses$/],
      ['About Rob', /\/about$/],
    ] as const) {
      await page.getByRole('contentinfo').getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test('skip link moves focus to main content', async ({ page }) => {
    test.skip(isMobile(page), 'keyboard check on desktop');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe('business directory', () => {
  test('search, filters, sort, chips, empty state and reset', async ({ page }) => {
    await page.goto('/businesses');
    const total = SAMPLE_LISTINGS.length;
    expect(await visibleCards(page)).toBe(total);

    // Keyword search narrows results and syncs to the URL.
    await page.getByLabel('Search listings', { exact: true }).fill('hvac');
    await expect(page.locator('[data-results-count]')).toHaveText(`Showing 1 of ${total} sample listings`);
    await expect(page).toHaveURL(/q=hvac/);
    await page.getByRole('button', { name: 'Remove filter Search: “hvac”' }).click();
    await expect.poll(() => visibleCards(page)).toBe(total);

    // Filters combine; an impossible combination shows the empty state.
    await openFilters(page);
    await page.getByLabel('Industry', { exact: true }).selectOption('Manufacturing');
    await expect.poll(() => visibleCards(page)).toBe(1);
    await page.getByLabel('Location', { exact: true }).selectOption('TX');
    await expect(page.getByRole('heading', { name: 'No businesses match those filters' })).toBeVisible();
    await expect(page).toHaveURL(/industry=Manufacturing&state=TX/);

    // Reset from the empty state restores everything.
    await page.locator('[data-results-empty]').getByRole('button', { name: 'Reset filters' }).click();
    await expect.poll(() => visibleCards(page)).toBe(total);
    await expect(page.locator('[data-results-count]')).toBeFocused();
    expect(new URL(page.url()).search).toBe('');

    // Price-on-request filter and price sort.
    await openFilters(page);
    await page.getByLabel('Asking price', { exact: true }).selectOption('on-request');
    const undisclosed = SAMPLE_LISTINGS.filter((l) => !l.showAskingPrice).length;
    await expect.poll(() => visibleCards(page)).toBe(undisclosed);
    await page.getByLabel('Asking price', { exact: true }).selectOption('');
    await page.getByLabel('Sort by', { exact: true }).selectOption('price-asc');
    const prices = await page
      .locator('[data-listing]:visible')
      .evaluateAll((lis) => lis.map((li) => (li as HTMLElement).dataset.price).filter(Boolean).map(Number));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('filter state is restored from a shared URL', async ({ page }) => {
    await page.goto('/businesses?industry=Technology&sort=revenue-desc');
    await expect.poll(() => visibleCards(page)).toBe(1);
    await expect(page.getByRole('button', { name: 'Remove filter Industry: Technology' })).toBeVisible();
    await expect(page.getByLabel('Sort by', { exact: true })).toHaveValue('revenue-desc');
  });

  test('loading and no-listings states can be previewed', async ({ page }) => {
    await page.goto('/businesses?preview=loading');
    await expect(page.locator('[data-results-loading]')).toBeVisible();
    await expect(page.locator('[data-results]')).toHaveAttribute('aria-busy', 'true');
    await page.goto('/businesses?preview=empty');
    await expect(page.getByRole('heading', { name: 'No businesses are listed right now' })).toBeVisible();
    expect(await visibleCards(page)).toBe(0);
  });

  test('cards open the listing detail page', async ({ page }) => {
    await page.goto('/businesses');
    const first = page.locator('[data-listing]:visible').first();
    const title = (await first.locator('h3').innerText()).trim();
    await first.getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText('Fictional sample for demonstration.')).toBeVisible();
  });
});

test.describe('buyer request dialog', () => {
  test('qualification, NDA and confirmation steps', async ({ page }) => {
    await page.goto(`/businesses/${SAMPLE_LISTINGS[0].slug}`);
    await page.getByRole('button', { name: 'Request details' }).click();
    const dialog = page.getByRole('dialog', { name: 'Request details' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Full name', { exact: true })).toBeFocused();

    // Empty submit shows an error summary and marks fields invalid.
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog.locator('.error-summary').first()).toBeFocused();
    await expect(dialog.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');

    await dialog.getByLabel('Full name', { exact: true }).fill('Jordan Buyer');
    await dialog.getByLabel('Email', { exact: true }).fill('jordan@example.com');
    await dialog.getByLabel('When are you hoping to buy?', { exact: true }).selectOption('3 – 6 months');
    await dialog.getByLabel('Experienced owner-operator', { exact: true }).check();
    await dialog.getByLabel('Funds available for a down payment or equity', { exact: true }).selectOption('$250K – $500K');
    await dialog.getByRole('button', { name: 'Continue' }).click();

    await expect(dialog.getByText('Step 2 of 3')).toBeVisible();
    await dialog.getByRole('button', { name: 'Submit request' }).click();
    await expect(dialog.getByLabel('Type your full name to confirm', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await dialog.getByLabel('I agree to keep any information I receive confidential.', { exact: true }).check();
    await dialog.getByLabel('Type your full name to confirm', { exact: true }).fill('Jordan Buyer');
    await dialog.getByRole('button', { name: 'Submit request' }).click();

    await expect(dialog.getByRole('heading', { name: /Request received/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('sold listings do not offer a request', async ({ page }) => {
    const sold = SAMPLE_LISTINGS.find((l) => l.status === 'sold')!;
    await page.goto(`/businesses/${sold.slug}`);
    await expect(page.getByRole('heading', { name: 'This business has been sold' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request details' })).toHaveCount(0);
  });
});

test.describe('seller inquiry form', () => {
  const form = (page: Page) => page.locator('[data-seller-form]');
  const next = (page: Page) => form(page).getByRole('button', { name: 'Continue' });

  async function fillStep1(page: Page, contact: 'Email' | 'Phone' = 'Email') {
    await form(page).getByLabel('Your name', { exact: true }).fill('Alex Owner');
    await form(page).getByRole('textbox', { name: 'Email' }).fill('alex@example.com');
    await form(page).getByRole('radio', { name: contact }).check();
  }
  async function fillStep2(page: Page) {
    await form(page).getByLabel('Industry', { exact: true }).selectOption('Manufacturing');
    await form(page).getByLabel('City or region', { exact: true }).fill('Columbus');
    await form(page).getByLabel('State', { exact: true }).selectOption('OH');
    await form(page).getByLabel('Approximate annual revenue', { exact: true }).selectOption('$1M – $3M');
    await form(page).getByLabel('Number of employees', { exact: true }).selectOption('11 – 25');
  }
  async function fillStep3(page: Page) {
    await form(page).getByLabel('I’m not ready yet, but I want to understand my options').check();
    await form(page).getByLabel(/I’m happy to be contacted/).check();
  }
  async function completeForm(page: Page) {
    await fillStep1(page);
    await next(page).click();
    await fillStep2(page);
    await next(page).click();
    await fillStep3(page);
  }

  test('steps validate one at a time, then the (mock) submission succeeds', async ({ page }) => {
    await page.goto('/sell');
    // Only the first step is shown.
    await expect(form(page).getByLabel('Industry', { exact: true })).toBeHidden();
    await expect(form(page).getByRole('button', { name: 'Send my inquiry' })).toBeHidden();

    await next(page).click();
    const summary = form(page).locator('.error-summary');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('heading')).toContainText('Please fix 3 answers');
    await expect(form(page).getByLabel('Your name', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#seller-name-error')).toContainText('Enter your name.');

    // Following a summary link focuses the field.
    await summary.getByRole('link', { name: 'Enter your email address.' }).click();
    await expect(form(page).getByRole('textbox', { name: 'Email' })).toBeFocused();

    await fillStep1(page);
    await expect(form(page).getByLabel('Your name', { exact: true })).not.toHaveAttribute('aria-invalid', 'true');
    await next(page).click();
    await expect(form(page).getByLabel('Industry', { exact: true })).toBeVisible();
    await expect(page.locator('[data-progress-text]')).toHaveText('Step 2 of 3: The business');

    // Back keeps answers.
    await form(page).getByRole('button', { name: 'Back' }).click();
    await expect(form(page).getByLabel('Your name', { exact: true })).toHaveValue('Alex Owner');
    await next(page).click();

    await next(page).click();
    await expect(summary.getByRole('heading')).toContainText('Please fix 5 answers');
    await fillStep2(page);
    await next(page).click();
    await fillStep3(page);
    await form(page).getByRole('button', { name: 'Send my inquiry' }).click();

    const success = page.locator('[data-success]');
    await expect(success).toBeFocused();
    await expect(success.getByRole('heading', { level: 2 })).toContainText('Thanks, Alex');
  });

  test('phone becomes required when phone contact is chosen; company name can be withheld', async ({ page }) => {
    await page.goto('/sell');
    await fillStep1(page, 'Phone');
    await next(page).click();
    await expect(page.locator('#seller-phone-error')).toContainText('Enter a phone number');

    await form(page).getByRole('textbox', { name: /^Phone/ }).fill('(555) 010-0000');
    await next(page).click();
    const company = form(page).getByRole('textbox', { name: /Company name/ });
    await company.fill('Acme Tooling');
    await form(page).getByLabel('I’d rather share my company name after our first conversation.').check();
    await expect(company).toBeDisabled();
    await expect(company).toHaveValue('');
  });

  test('ticking an unlabelled checkbox after a failed step throws no error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/sell');
    await fillStep1(page);
    await next(page).click();
    await next(page).click(); // fail step 2 so live re-validation is switched on
    await form(page).getByLabel('I’d rather share my company name after our first conversation.').check();
    await expect(form(page).getByRole('textbox', { name: /Company name/ })).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('submission failure keeps answers and shows an error', async ({ page }) => {
    await page.goto('/sell?preview=error');
    await completeForm(page);
    await form(page).getByRole('button', { name: 'Send my inquiry' }).click();
    await expect(form(page).locator('[data-submit-error]')).toBeFocused();
    await expect(form(page).getByLabel(/happy to be contacted/)).toBeChecked();
  });
});

test.describe('motion', () => {
  test('reduced motion: every section is visible without scrolling animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const hidden = await page.locator('[data-reveal]').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1' || el.classList.contains('reveal-pending')).length,
    );
    expect(hidden).toBe(0);
  });

  test('with motion: below-the-fold sections reveal as they scroll into view', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const pending = page.locator('[data-reveal].reveal-pending');
    expect(await pending.count()).toBeGreaterThan(0);
    // Hero content is never hidden.
    await expect(page.locator('.page-hero [data-reveal]')).toHaveCount(0);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    // Every revealed section ends fully opaque.
    await expect
      .poll(() =>
        page
          .locator('[data-reveal]')
          .evaluateAll((els) => els.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length),
      )
      .toBe(0);
  });
});

test.describe('privacy', () => {
  test('private listing details never reach the built site', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(html|js|json|css|txt|xml)$/.test(name)) files.push(path);
      }
    };
    walk('dist');
    const built = files.map((f) => readFileSync(f, 'utf8')).join('\n');

    for (const listing of SAMPLE_LISTINGS) {
      if (!listing.privateAddress) continue;
      if (listing.addressVisibility !== 'exact') {
        expect(built, `${listing.id} street address`).not.toContain(listing.privateAddress.street);
      }
      if (listing.addressVisibility === 'region') {
        expect(built, `${listing.id} ZIP`).not.toContain(listing.privateAddress.postalCode);
      }
      if (!listing.showAskingPrice && listing.askingPrice) {
        expect(built, `${listing.id} asking price`).not.toContain(String(listing.askingPrice));
      }
    }
  });
});
