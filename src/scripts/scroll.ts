// Shared smooth-scroll helper. motion.ts registers the Lenis instance when smooth scrolling is on;
// otherwise this falls back to the browser's own scrolling.
import type Lenis from 'lenis';

let lenis: Lenis | null = null;

export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

const headerOffset = () => (document.querySelector<HTMLElement>('[data-site-header]')?.offsetHeight ?? 72) + 16;

export function scrollToElement(target: HTMLElement, { focus = false } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis) {
    lenis.scrollTo(target, { offset: -headerOffset(), duration: 1.2 });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (focus) {
    if (!target.hasAttribute('tabindex') && !target.matches('a, button, input, select, textarea')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}
