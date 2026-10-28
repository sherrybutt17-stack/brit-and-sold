// Site-wide motion and interaction layer. Everything here is progressive enhancement: content is
// fully visible and usable without it, and anything decorative is skipped for reduced-motion users.
import Lenis from 'lenis';
import { scrollToElement, setLenis } from './scroll';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ---------- Smooth scrolling ---------- */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.11, smoothWheel: true });
  setLenis(lenis);

  // Pause smooth scrolling while a modal dialog is open so the dialog scrolls natively.
  const syncDialogs = () => {
    if (document.querySelector('dialog[open]')) lenis?.stop();
    else lenis?.start();
  };
  new MutationObserver(syncDialogs).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  });
}

/* In-page links: scroll smoothly, then move focus to the target for keyboard and screen-reader users. */
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const url = new URL(link.href);
  if (url.pathname !== location.pathname || !url.hash) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  event.preventDefault();
  history.pushState(null, '', url.hash);
  scrollToElement(target, { focus: true });
});

/* ---------- Header: solid once scrolled, tucks away while scrolling down ---------- */
const header = document.querySelector<HTMLElement>('[data-site-header]');
let lastY = window.scrollY;
function updateHeader() {
  if (!header) return;
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 8);
  const goingDown = y > lastY + 4;
  const goingUp = y < lastY - 4;
  if (goingDown && y > 520 && !header.contains(document.activeElement)) header.classList.add('is-hidden');
  else if (goingUp || y < 520) header.classList.remove('is-hidden');
  lastY = y;
}
header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));

/* ---------- Reveal on scroll ---------- */
const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
if (revealEls.length && !reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of revealEls) {
    // Never hide what is already on screen: the effect can't delay first paint or block content.
    if (el.getBoundingClientRect().top < window.innerHeight) continue;
    el.classList.add('reveal-pending');
    io.observe(el);
  }
}

/* ---------- Pointer effects (mouse and trackpad only) ---------- */
if (finePointer) {
  // A soft light that trails the cursor across dark sections.
  for (const section of document.querySelectorAll<HTMLElement>('[data-glow]')) {
    let frame = 0;
    section.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = section.getBoundingClientRect();
        section.style.setProperty('--gx', `${e.clientX - r.left}px`);
        section.style.setProperty('--gy', `${e.clientY - r.top}px`);
        section.setAttribute('data-glow-active', '');
      });
    });
    section.addEventListener('pointerleave', () => section.removeAttribute('data-glow-active'));
  }

  // Card spotlight: position the glow under the pointer (outermost card and any nested glow areas).
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = (e.target as Element).closest<HTMLElement>('[data-spotlight]');
      if (!card) return;
      const outer = card.parentElement?.closest<HTMLElement>('[data-spotlight]') ?? card;
      for (const el of [outer, ...outer.querySelectorAll<HTMLElement>('[data-spotlight]')]) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    },
    { passive: true },
  );

  // Magnetic buttons lean a few pixels toward the cursor.
  if (!reduceMotion) {
    for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -10, 10);
        const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.35, -7, 7);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    }
  }
}

/* ---------- Scroll-linked effects ---------- */
const marquees = Array.from(document.querySelectorAll<HTMLElement>('[data-marquee]'));
const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
const stories = Array.from(document.querySelectorAll<HTMLElement>('[data-story]')).map((el) => ({
  el,
  list: el.querySelector<HTMLElement>('.story__steps')!,
  steps: Array.from(el.querySelectorAll<HTMLElement>('[data-story-step]')),
  current: el.querySelector<HTMLElement>('[data-story-current]'),
  label: el.querySelector<HTMLElement>('[data-story-label]'),
  active: -1,
}));

function updateScrollEffects() {
  const vh = window.innerHeight;

  if (!reduceMotion) {
    for (const m of marquees) {
      const r = m.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const progress = (vh - r.top) / (vh + r.height);
      const setWidth = (m.querySelector<HTMLElement>('.marquee__set')?.offsetWidth ?? 0) * 0.55;
      m.style.setProperty('--marquee-x', `${(-progress * setWidth).toFixed(1)}px`);
    }
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const factor = Number(el.dataset.parallax) || 0.1;
      const offset = (r.top + r.height / 2 - vh / 2) * -factor;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  }

  for (const story of stories) {
    const r = story.list.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    const line = vh * 0.55;
    story.el.style.setProperty('--p', clamp((line - r.top) / r.height, 0, 1).toFixed(3));
    let active = 0;
    story.steps.forEach((step, i) => {
      if (step.getBoundingClientRect().top < line) active = i;
    });
    if (active === story.active) continue;
    story.active = active;
    story.steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === active);
      step.classList.toggle('is-done', i < active);
    });
    if (story.current) {
      story.current.textContent = String(active + 1).padStart(2, '0');
      story.current.classList.remove('is-changing');
      void story.current.offsetWidth; // restart the swap animation
      story.current.classList.add('is-changing');
    }
    if (story.label) story.label.textContent = story.steps[active].querySelector('.story__title')?.lastChild?.textContent?.trim() ?? '';
  }
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateHeader();
    updateScrollEffects();
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

/* ---------- Counting numbers ---------- */
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});
const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
  const format = (el: HTMLElement, value: number) =>
    el.dataset.countFormat === 'usd' ? usdCompact.format(value) : Math.round(value).toString();
  const run = (el: HTMLElement) => {
    const to = Number(el.dataset.count);
    const final = el.textContent;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(2, -10 * t);
      el.textContent = t < 1 ? format(el, to * eased) : final;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => io.observe(el));
}

/* ---------- Mobile sticky call to action ---------- */
const stickyCta = document.querySelector<HTMLElement>('[data-sticky-cta]');
const hero = document.querySelector<HTMLElement>('.page-hero');
if (stickyCta && hero && 'IntersectionObserver' in window) {
  const blockers = new Set<Element>();
  let heroVisible = true;
  const sync = () => stickyCta.toggleAttribute('data-visible', !heroVisible && blockers.size === 0);
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  }).observe(hero);
  const blockIo = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) blockers.add(entry.target);
      else blockers.delete(entry.target);
    }
    sync();
  });
  document.querySelectorAll('[data-hide-sticky], footer').forEach((el) => blockIo.observe(el));
}
