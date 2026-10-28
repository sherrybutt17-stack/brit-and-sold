# Brit and Sold with Rob Dawson: website mockup

A four-page business brokerage website for business owners exploring a sale and for buyers browsing businesses for sale. It is built with [Astro](https://astro.build) as a static site, using plain CSS and a small amount of vanilla TypeScript, with [Lenis](https://github.com/darkroomengineering/lenis) for smooth scrolling.

> **Demo build.** Every listing is fictional sample data, and both forms are interactive mocks that send and store nothing. Pages are marked `noindex`, and `robots.txt` disallows crawling. The demo flag lives in `src/config/site.ts` (`IS_DEMO`).

## Run it

```bash
npm install
npm run dev            # local development at http://localhost:4321
npm run build          # production build into dist/
npm run preview        # serve dist/ (Astro 7 runs this in the foreground; add --background to detach)
npm run check          # TypeScript and Astro diagnostics
npm test               # Playwright: functional, accessibility (axe) and privacy checks; build first
npm run screenshots    # full-page and interactive-state screenshots into test-results/
```

To install the Playwright browser on first use, run `npx playwright install chromium`.

## Live preview (GitHub Pages)

Every push to `main` builds the site and publishes it to **https://sherrybutt17-stack.github.io/brit-and-sold/** using `.github/workflows/deploy.yml`.

- **One-time setup:** in the repository, go to Settings → Pages → Build and deployment → Source, and choose **GitHub Actions**. GitHub Pages only works from a private repository on a paid plan; on a free plan, the repository must be public.
- **The live site is public** to anyone with the link, although the pages are marked `noindex`.
- **Links:** because Pages serves the site from `/brit-and-sold/`, internal links must go through `url()` from `src/lib/url.ts`. The workflow sets `BASE_PATH` and `SITE_URL`; locally the site runs at the root.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Home. Hero for owners, an owner/buyer split, common concerns, process preview, sample listings, a Meet Rob teaser and a preparation call to action. |
| `/businesses` | Directory with keyword search; filters for industry, state, revenue, asking price, company size and status; five sort orders; removable filter chips; reset; URL-synced state; and empty, no-listings and loading states. |
| `/businesses/[slug]` | Listing detail page, generated statically and not shown in the main nav. Shows key metrics, overview, strengths, growth opportunities and a confidentiality notice, plus a **Request details** dialog with a three-step mock: qualification → NDA → confirmation. |
| `/sell` | Seller page. Covers what happens after you submit, discretion, the step-by-step process, a three-step inquiry form with a progress bar, a "what buyers will ask about" readiness checklist and an FAQ. |
| `/about` | Rob's biography (verified facts only), the Why Brit and Sold placeholder, how we work, seller and buyer working relationships, and the process in place of social proof. |

To preview states that are otherwise hard to reach:
- `/businesses?preview=loading`
- `/businesses?preview=empty`
- `/sell?preview=error` (a failed form submission)

## Where things live

| What | File |
| --- | --- |
| Brand name, nav, CTA labels, process steps, **owner facts still needed** | `src/config/site.ts` |
| Listing type and sample listings | `src/data/listings.ts` |
| Filter buckets (USD) and sort options | `src/data/filters.ts` |
| Public listing transform, formatting | `src/lib/listings.ts` |
| Design tokens (colors, type, spacing, motion) | `src/styles/tokens.css` |
| Motion and atmosphere styles (light field, glass, text reveals, page transitions) | `src/styles/effects.css` |
| Motion behaviour (smooth scroll, header, reveals, cursor glow, scroll effects, counters) | `src/scripts/motion.ts` |
| Seller form submit hook | `submitInquiry()` in `src/scripts/seller-form.ts` |
| Buyer request submit hook | `submitRequest()` in `src/scripts/request-dialog.ts` |

`OWNER_FACTS` currently holds **sample values** so the mockup reads as finished: a `.example` email, a fictional 555-01xx phone number, and generic fees, timeline, service area, focus and response time. Replace them with Rob's real details before launch. Any fact set to `null` (currently licensing, booking link and privacy policy) is simply left off the site.

## Replacing the sample listings

1. Replace `SAMPLE_LISTINGS` in `src/data/listings.ts` with approved listings using the same `Listing` shape (set `isSample: false`), or load them from a CMS at build time.
2. For each listing, choose:
   - `addressVisibility`:
     - `region` (the default): shows the broker-written area label only, such as "Central Texas, TX".
     - `partial`: shows city, state and ZIP.
     - `exact`: shows the full street address, only with the seller's explicit approval.
   - `showAskingPrice`: shows "On request" when false.
3. Pages only ever receive listings through `toPublicListing()`. It strips the street address, ZIP and unapproved asking price before anything is rendered. `npm test` includes a check that fails if a private street address, ZIP or hidden price appears anywhere in `dist/`.
4. Keep genuinely private data, such as seller identity, financials and the exact address, in a CRM or backend behind the NDA step, not in this repository.

## Connecting the forms

Neither form sends data yet. To go live, replace the body of `submitInquiry()` and `submitRequest()` with a `POST` to your chosen backend (for example a serverless function, CRM or form service). Throw on a non-2xx response so the built-in error state appears. Validation, the error summary, focus handling, the "Sending…" state and the success state are already implemented. When live, remove the demo notices by setting `IS_DEMO = false`.

## Owner facts still needed

These are currently either **sample values** in `src/config/site.ts` or left off the site.

- [ ] Contact email, phone number and booking link
- [ ] Service area, plus industries and deal sizes Rob works with
- [ ] Brokerage licensing, registrations or memberships (if any)
- [ ] Fee structure and typical timeline
- [ ] Response-time commitment for new inquiries
- [ ] Rob's brokerage experience and track record, and why he started Brit and Sold (including whether "Brit" refers to a UK connection)
- [ ] Privacy policy and final NDA terms
- [ ] Real listings, with per-field approval for price and address visibility
- [ ] Approved transaction case studies (none are shown; Rob's coaching and marketing testimonials are deliberately **not** used as brokerage proof)
- [ ] A logo (the site currently uses a typographic wordmark and a "B&S" favicon)
- [ ] Production domain (replace `site` in `astro.config.mjs`)

**Draft copy to review.** These describe how the service works and need Rob's sign-off:
- The five-step process in `PROCESS_STEPS`.
- The "How we work" values and working relationships on `/about`.
- Statements that Rob personally reviews inquiries and is the person owners talk to.
- That inquiry details aren't shared with buyers.
- The FAQ answers on `/sell`.

**Biography.** The bio on `/about` is adapted from robdawson.tv:
- entrepreneur, CEO and business coach;
- 12+ years in digital-marketing consulting;
- left high school, went through night school and became CEO of his own company;
- hosts the *Faith on Fire* podcast.

The two photos come from the same site. Both need Rob's approval.

## Performance (measured 2026-10-28, after the motion redesign)

**Test conditions:** Lighthouse 13.6.0, default mobile preset (emulated Moto G Power, simulated slow 4G: 150 ms RTT, ~1.6 Mbps, 4× CPU slowdown), against `astro preview` on localhost, using Chrome for Testing 156. These are lab numbers. INP needs real-user data, so Total Blocking Time is reported as the lab proxy.

| Page | Perf | LCP | CLS | TBT | Page weight |
| --- | --- | --- | --- | --- | --- |
| `/` | 99–100 | 0.93–0.94 s | 0 | 7–105 ms | 180 KB |
| `/businesses` | 99–100 | 1.06–1.57 s | 0 | 0–5 ms | 190 KB |
| `/sell` | 100 | 0.92 s | 0 | 69 ms | 184 KB |
| `/about` | 99 | 2.27 s | 0 | 47 ms | 223 KB |
| `/businesses/[slug]` | 100 | 0.91 s | 0 | 74 ms | 181 KB |

- Accessibility and Best Practices scored 100 on every page.
- Runs started immediately after a build, or back-to-back, occasionally showed TBT spikes of up to 4.3 s. Re-running with pauses gave the figures above, so those spikes were CPU contention on the test machine. Measure again on the production host and real devices.
- The italic display font and the smooth-scroll and motion scripts added about 75 KB per page compared with the first version.

**What keeps it fast:**
- Static HTML.
- Self-hosted Latin-subset variable fonts with metric-matched fallbacks.
- AVIF images with WebP fallback and explicit dimensions.
- Lazy loading below the fold.
- Animation limited to transform, opacity and colour.
- No decorative background images, which Lighthouse would otherwise treat as the main content.

## Motion and interaction

- **Moving light field:** slow blue light drifts behind the dark heroes, the closing CTA band and the footer, and a soft glow trails the cursor (`Aurora.astro`, `data-glow`).
- **Headlines:** they rise in word by word (`SplitText.astro`). Use `*asterisks*` for the italic accent.
- **Section reveals:** sections fade up as they scroll into view (`data-reveal`).
- **Smooth scrolling:** wheel scrolling is smoothed by Lenis; touch scrolling stays native. In-page links scroll smoothly and then move keyboard focus to the target.
- **Header:** transparent over the dark heroes, solid once you scroll, and it tucks away while you scroll down.
- **Cards and buttons:** card glows follow the cursor (`data-spotlight`), and primary buttons lean slightly toward it (`data-magnetic`).
- **Scroll-linked effects:** a marquee of commitments moves with the page, Rob's portrait has a gentle parallax, and the process story highlights the step in view with a counter and progress rail.
- **Page changes:** pages cross-fade (View Transitions), and a listing's title flows into the detail page's heading.
- **Directory:** cards glide to their new positions when filters or the sort order change.
- **Listing figures:** the metrics on detail pages count up when they come into view.
- **Mobile:** a sticky call to action appears after the hero and hides near the form and the footer.

## Accessibility

- Semantic landmarks, a skip link and one `h1` per page.
- Labelled controls, inline errors linked with `aria-describedby`, and a focusable error summary.
- `aria-live` result counts and step announcements.
- Native `<dialog>` for the menu and request flow, which handles focus trapping and Escape.
- Visible focus rings. Color pairs were checked to WCAG AA, and axe reports no serious or critical violations.
- **Reduced motion:** with `prefers-reduced-motion`, all motion is skipped, including smooth scrolling, reveals, the light field, parallax, the marquee and transitions. Content is never hidden if JavaScript fails.
- **Contrast:** upcoming process steps are de-emphasised by color, never by fading text below AA contrast.

## Credits

Icons are from [Lucide](https://lucide.dev) (ISC licence), inlined in `src/lib/icons.ts`. Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) (MIT). The fonts are Newsreader and Instrument Sans (SIL Open Font License), served via Fontsource.
