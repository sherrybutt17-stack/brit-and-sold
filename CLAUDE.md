# Built and Sold with Rob Dawson — project notes

Four-page business brokerage website mockup. Public brand name is exactly **Built and Sold with Rob Dawson**.

## Decisions (from the owner, 2026-10-28)
- **Market: US / USD.** US states and cities, `$` ranges, US spelling.
- **No voice-note section.** The original brief mentioned one; the owner asked for it to be removed. Do not re-add it.
- **Everything is demo-only.** Listings are fictional samples (`isSample: true`) and both forms (seller inquiry, buyer request/NDA) are interactive mocks with no backend. The UI must keep saying so until real data and a backend exist.
- **No fabricated claims about Rob.** robdawson.tv covers only coaching, speaking, the podcast and digital marketing — nothing about brokerage. Never invent deals, credentials, licensing, buyer counts, track record, outcomes, or quotes attributed to Rob.
- **No visible placeholders; sample business details instead (owner request, 2026-10-28).** The "To confirm" chips were removed. Operational details in `OWNER_FACTS` (`src/config/site.ts`) hold clearly fake sample values (`.example` email, 555-01xx phone, generic fees/timeline/service area/focus) to be replaced before launch. Facts left `null` (licensing, booking link, privacy policy) are simply not rendered.
- **Never use Rob's coaching/marketing testimonials** as brokerage or transaction proof.
- **No free-valuation promise** and no fake urgency (countdowns, scarcity, deadlines). No guarantees of sale, price, buyer, timeline, tax or financing outcome.
- **Listing privacy:** public pages show city/region only by default. Exact street address, seller identity and other identifying details are never rendered unless a listing explicitly sets `addressVisibility: 'exact'`. Components must receive listings via `toPublicListing()`.

- **Premium motion pass (owner request, 2026-10-28):** dark navy heroes with a moving blue light field and cursor glow ("thermal" motion), word-by-word headline reveals, smooth scrolling, page transitions, scroll-linked process story, three-step seller form. Keep it — but every effect must stay behind `prefers-reduced-motion: no-preference` and keep LCP ≤ 2.5s.

## Stack
- Astro (static output) + plain CSS custom properties + vanilla TypeScript `<script>`s, plus `lenis` for smooth wheel scrolling. No React/Tailwind/UI libraries — keep JS and dependencies lean (target: LCP ≤ 2.5s, CLS ≤ 0.1 on mobile).
- Motion lives in `src/styles/effects.css` (CSS) and `src/scripts/motion.ts` (behaviour), driven by data attributes: `data-reveal`, `data-glow`, `data-spotlight`, `data-magnetic`, `data-parallax`, `data-marquee`, `data-story`, `data-count`, `data-sticky-cta`, `data-hide-sticky`. Shared smooth scrolling goes through `scrollToElement()` in `src/scripts/scroll.ts`.
- Every page starts with `<PageHero>` (dark); the header is transparent over it until scrolled. Sections directly after a hero use `.lift` (rounded overlap).
- Fonts are self-hosted via Fontsource files, loaded through Astro's `fonts` config with the `local` provider (Newsreader display, Instrument Sans body).
- Icons are inline SVG paths from Lucide (ISC) in `src/lib/icons.ts`, rendered by `src/components/Icon.astro`.

## Commands
- `npm run dev` / `npm run build` / `npm run check`
- `npm test` runs `tests/site.spec.ts` against the built site (build first). `npm run screenshots` writes review images to `test-results/`.
- Astro 7's `astro preview` holds a lock file; Playwright starts it with `--ignore-lock`. Stop a detached server with `npx astro preview stop`.

## Deploy
- GitHub repo: https://github.com/sherrybutt17-stack/brit-and-sold (private). Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` → https://sherrybutt17-stack.github.io/brit-and-sold/
- Pages serves from `/brit-and-sold/`: always build internal links with `url()` from `src/lib/url.ts` (never hard-code `href="/..."`). The workflow sets `BASE_PATH`/`SITE_URL`; local builds leave them unset.
- `git push` works from this machine (credentials cached after the owner's first VS Code sign-in). Pages source is set to GitHub Actions; the repo is public.

## Gotchas
- Scoped styles only reach a child component's root element if the child spreads `...rest` onto it (Astro passes the parent's `data-astro-cid-*` as a prop). `Icon.astro` does this, so parent CSS like `.card .icon` works.
- Controls linked to a form with the `form="…"` attribute (e.g. the directory sort select) don't bubble events to the `<form>`; attach listeners directly.
- `html { scroll-behavior: smooth }` is on when motion is allowed (and Lenis is active); scripted scrolling in tests must pass `behavior: 'instant'`.
- Don't fade hero LCP content from opacity 0 (it delays LCP); hero images use `.load-zoom` (transform only). Large decorative `background-image`s (e.g. grain textures) become LCP candidates — avoid them.
- Don't dim text with opacity (it fails contrast checks); de-emphasise with AA-passing colours instead.
- Directory filter animations use same-document View Transitions, but search typing does not — a transition would freeze the input's snapshot.
- `astro preview stop` stops *any* background preview, including the one the owner is viewing on port 4321 — restart it afterwards.

## Approved build plan (2026-10-28)

Source: the plan approved at the start of the build. Update this section if scope changes.

### Stack decision
**Astro (static output) with plain CSS custom properties and vanilla TypeScript islands.** There is no React, Tailwind, shadcn, or Motion.
- Every route ships as pre-rendered HTML with near-zero JavaScript, which is the best fit for the under-3-second mobile target.
- Astro's built-in image pipeline (sharp) produces AVIF/WebP with explicit dimensions, which prevents layout shift.
- File-based routing gives the four routes plus static detail pages.
- **Runtime dependencies:** `astro`, `@fontsource-variable/newsreader` (display serif), and `@fontsource-variable/instrument-sans` (body), using the Latin subset with the hero font preloaded.
- **Dev dependencies:** `@astrojs/check`, `typescript`, `@types/node`, `@playwright/test`, and `@axe-core/playwright`. Lighthouse runs through `npx` and is not installed into the project. (Lenis was added as a runtime dependency in the motion pass.)
- Icons come from a local `Icon.astro` that inlines SVG paths copied from Lucide (ISC licence, credited in the README). This avoids an icon package.
- Page transitions use the zero-JavaScript CSS `@view-transition { navigation: auto }` and are disabled under reduced motion.

### Project structure
```
astro.config.mjs  package.json  tsconfig.json  playwright.config.ts  README.md
public/            favicon.svg (B&S monogram), robots.txt
src/assets/rob/    4 images downloaded from robdawson.tv, optimised at build
src/config/site.ts brand name, nav, CTA labels, IS_DEMO flag, all owner-to-confirm facts in one place
src/data/listings.ts   Listing type + ~12 clearly-flagged sample listings (isSample: true)
src/data/filters.ts    USD bucket definitions (revenue, asking price, employees), sort options
src/lib/listings.ts    toPublicListing(), formatUSD(), formatLocation(), bucket matching
src/layouts/BaseLayout.astro   head/meta (noindex while IS_DEMO), fonts, skip link, Header, Footer
src/components/        Header, Footer, Button, Icon, Placeholder, SampleBadge, StatusBadge,
                       ListingCard, ProcessSteps, FaqList, CtaBand, SectionHeading,
                       SellerForm, RequestDetailsDialog, DemoNotice
src/scripts/           reveal.ts, nav.ts, directory.ts, form-validation.ts (shared),
                       seller-form.ts, request-dialog.ts
src/styles/            tokens.css (palette/type/spacing), global.css
src/pages/             index.astro, businesses/index.astro, businesses/[slug].astro,
                       sell.astro, about.astro, 404.astro
tests/site.spec.ts, tests/screens.spec.ts
```

### Design system
- **Palette:**
  - Deep navy `#0A1A33` and `#0F2547` for bands and the footer.
  - Cobalt `#1F4FD1` for the primary CTA and links.
  - Light blue `#9CC3FF` for accents on navy, and `#E6F0FF` for tinted panels.
  - Mist `#F6F8FB` and white backgrounds, slate text `#1B2433`, muted `#536079`.
  - Every text and background pair will be checked to meet WCAG AA during implementation.
- **Typography:** large editorial serif headlines in Newsreader and a clean sans for body text in Instrument Sans. Numbered section labels (01, 02, …) and thin ledger rules give an editorial feel.
- **Signature motif:** a faint blueprint grid in navy sections ("the business you built"). There is no stock-photo hero; the right-hand side of the hero is a card titled "What your first conversation covers".
- **Wordmark:** "Built and Sold" in serif with "with Rob Dawson" set small beneath it. Rob's old podcast logo is not used.

### Pages

#### Home (`/`)
- **Header:** wordmark, then Browse Businesses, Sell Your Business, About Rob, and the CTA **Talk About Selling**.
- **Hero:**
  - Specific H1 aimed at owners (direction: "Thinking about selling? Start with a quiet conversation, not a public listing.") with plain-English subcopy.
  - Primary CTA **Talk About Selling** (goes to `/sell#inquiry`) and secondary CTA **Browse Businesses**.
  - A first-conversation card on the right.
  - No offer of a free valuation.
- **Route by audience:** "I own a business" and "I'm looking to buy" cards, following Alaris's focused routing.
- **Concerns answered (concise):** confidentiality, valuation expectations, disruption, timing, buyer quality, preparation.
- **Process preview:** a 5-step horizontal stepper (vertical on mobile) whose connector line draws in on reveal. The steps are generic industry practice and are flagged in `site.ts` for the owner to confirm.
- **Featured sample listings:** 3 cards with "Sample" badges, linking to `/businesses`.
- **Meet Rob teaser:** photo plus verified facts only, linking to `/about`.
- **Ethical urgency band:** buyers scrutinise the last few years of financials, so preparation takes time. No countdowns and no scarcity.
- **Final CTA and footer:** nav, a sample-data notice, a notice that forms are demos, and contact details shown as a placeholder.

#### Browse Businesses (`/businesses`)
- **Demo banner:** "All listings shown are fictional samples for layout testing — not real opportunities."
- **Toolbar:**
  - Keyword search (debounced; matches title, overview, industry, city, and state).
  - Selects for industry, state, revenue range, asking-price range (including a "price not disclosed" option), employees, and status.
  - Sort by newest, revenue (high to low, low to high), and asking price (high to low, low to high).
  - Removable active-filter chips and a **Reset filters** button.
  - On mobile the filters collapse into a "Filters (n)" disclosure.
- **Behaviour:**
  - Cards are rendered on the server, so the page works without JavaScript. `directory.ts` filters and sorts the existing DOM nodes using `data-*` attributes that hold public fields only.
  - Filter state syncs to the query string, so filtered views can be shared and the back button works.
  - A results count is announced via `aria-live`.
- **States:**
  - Results.
  - **Filtered-empty:** a message, a reset action, and "Tell us what you're looking for" (goes to the buyer inquiry).
  - **No listings:** shown when the data array is empty, with a register-interest CTA.
  - **Loading:** a skeleton grid. It can be previewed with `?preview=loading` or `?preview=empty`, which is documented in the README. It is wired so that a future remote data source can use it.
- **Listing card:**
  - Sample badge, status badge (Active, Under LOI, Under contract, Sold), title, industry.
  - Location at city/region level, revenue, SDE/EBITDA/cash flow, asking price or "Price on request", employees, and years operating.
  - Links to the detail page.
- **Buyer CTA block:** begin the qualification process.

#### Listing detail (`/businesses/[slug]`, statically generated, not in the main nav)
- Breadcrumb, a key-metrics strip, overview, strengths, and growth opportunities.
- Location shown according to `addressVisibility`, plus a confidentiality notice.
- A **locked panel** lists what becomes available after the NDA (business name, exact address, financials). No such data is present in the HTML.
- **Request Details** opens a native `<dialog>` (focus trap and Escape handling are built in) with a 3-step mock:
  1. Buyer qualification: name, email, optional phone, buyer type, funds available, timeframe, acquisition experience.
  2. Mock NDA summary with an agree checkbox and a typed-name signature.
  3. Confirmation that explains what would happen in a live system.

#### Sell Your Business (`/sell`)
- Focused headline, reassuring subcopy, and "What happens after you submit" in 3 steps. The response time is a placeholder.
- **Confidentiality language** without absolute promises: the company name can be held back until after the first conversation, and owners are told not to upload confidential documents through the form.
- **Detailed process steps** with editable placeholders (timelines and fees are marked as for the owner to confirm).
- **Readiness content:** an educational "What buyers will ask about" checklist, influenced by Baker Tilly. It serves owners who aren't ready yet.
- **FAQ accordion** using `<details>`. Fees and service area are placeholders, and nothing is guaranteed.
- **Seller form (`#inquiry`):**
  - Name, email, optional phone.
  - Company name, with a "share after initial conversation" checkbox that disables the field.
  - Industry, city/region and state.
  - Revenue and employee ranges.
  - "Where are you in your thinking?", which includes not-ready-yet options, and reason or timing.
  - Preferred contact method, consent checkbox, and privacy notice.
- **Validation:**
  - Native constraints plus custom messages, `aria-invalid` and `aria-describedby`.
  - An error summary with `role="alert"` that focuses the first invalid field.
  - A mock async submit with a "Sending…" state.
  - A success panel that receives focus, and an error state (previewable with `?preview=error`).
- A visible **"Demo form — nothing is sent or stored"** label. No `localStorage` is used for personal data.

#### About Rob (`/about`)
- Portrait plus a bio built only from robdawson.tv facts: entrepreneur, CEO of his own company, business coach, 12+ years in digital-marketing consulting, his personal story in brief, and the podcast mentioned once. Every fact is flagged in the README for Rob to approve.
- **"Why Built and Sold"** origin, credentials or licensing, industries, and service area: all shown as `<Placeholder>` chips.
- **How we work:** values (discretion, straight answers, preparation, buyer fit) and what the working relationship looks like, in separate columns for sellers and buyers.
- **No testimonials.** The process section stands in for social proof.
- Separate CTAs: Talk About Selling and Browse Businesses.

### Data model and privacy (`src/data/listings.ts`, `src/lib/listings.ts`)
```ts
type ListingStatus = 'active' | 'under-loi' | 'under-contract' | 'sold';
type AddressVisibility = 'exact' | 'partial' | 'region'; // default 'region'
interface Listing {
  id; slug; isSample: boolean; title; industry;
  location: { city; region?; state; country: 'US' };
  privateAddress?: { street; postalCode };   // never rendered unless visibility === 'exact'
  addressVisibility: AddressVisibility;      // partial = city, state + ZIP
  revenue: number; earnings?: { kind: 'SDE' | 'EBITDA' | 'Cash flow'; amount: number };
  askingPrice?: number; showAskingPrice: boolean;
  employees: { min: number; max: number }; yearsOperating?: number;
  overview; strengths?: string[]; growthOpportunities?: string[];
  status: ListingStatus; listedAt: string; // ISO
}
```
- Components receive only the result of `toPublicListing()`, which removes `privateAddress` unless visibility is `exact`, and hides the asking price unless `showAskingPrice` is set.
- A test greps `dist/` to confirm that no private street address leaks.
- **Sample data:** about 12 fictional listings across varied industries and states, with plausible numbers and a mix of statuses. Every record is `isSample: true` and labelled in the UI.
- The README explains how to swap in real data. Real private data belongs in a CRM or backend, not this repository.

### Motion and accessibility
- **Reveal on scroll:** IntersectionObserver applies opacity/transform reveals. They only apply when `html.js` is set and `prefers-reduced-motion: no-preference`. The hero and LCP content are never hidden.
- **Hover feedback:** restrained card lifts (transform only) and visible `:focus-visible` rings.
- **Mobile nav:** a `<dialog>`-based menu.
- **Structure:** skip link, landmarks, one H1 per page, labelled controls, alt text, and keyboard support for all filters, dialogs, and forms.

### Verification
1. `npm run build` and `npx astro check` complete with no errors.
2. **Playwright functional suite:**
   - All routes return 200 with an H1 and no console errors.
   - Internal links resolve.
   - Desktop nav and the mobile menu work.
   - Search narrows results, filters and sorting work, the filtered-empty state appears, reset restores all listings, and the URL syncs.
   - The detail dialog flow works (validation, NDA step, success).
   - Seller form validation works for both the error and success paths.
   - Under `reducedMotion: 'reduce'`, all content is visible.
   - The privacy grep of `dist/` passes.
3. axe-core scan of each page has no serious or critical violations, and a contrast spot-check passes.
4. **Screenshots** of the four pages plus one detail page at 390×844 and 1440×900. I'll review them visually and fix layout issues.
5. **Lighthouse** (mobile preset, simulated throttling) runs against `astro preview` for each route. I'll report the actual LCP, CLS, TBT (as a lab proxy for INP), and score, with test conditions noted. No load-time claim will be made without a measurement.

### Handoff (README plus final message)
- The routes created and the interactions implemented.
- Statement that the listings and both forms are **demo-only** with no backend, and where to plug one in (`submitInquiry()` in `seller-form.ts` and in `request-dialog.ts`).
- Statement that the voice note was **removed at the user's request**.
- The measured performance results.
- **Facts the owner still needs to provide:** contact details and booking link, service area, licensing or registration, fees, industry and deal-size focus, real process and timelines, response-time commitment, NDA and privacy policy, real listings with per-field approval, transaction track record, the Built and Sold origin story, approval of the bio and photos, and a logo.
