// Client-side search, filtering and sorting for /businesses.
// Listing cards are rendered on the server; this script only shows, hides and reorders them using
// the public data-* attributes on each <li data-listing>. Filter state is mirrored in the URL.

import { PRICE_BUCKETS, PRICE_UNDISCLOSED, REVENUE_BUCKETS, SIZE_BUCKETS, inBucket } from '../data/filters';

const FILTER_KEYS = ['q', 'industry', 'state', 'revenue', 'price', 'size', 'status'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type State = Record<FilterKey, string> & { sort: string };

const DEFAULT_SORT = 'newest';
const FILTER_LABELS: Record<FilterKey, string> = {
  q: 'Search',
  industry: 'Industry',
  state: 'State',
  revenue: 'Revenue',
  price: 'Asking price',
  size: 'Size',
  status: 'Status',
};

const form = document.querySelector<HTMLFormElement>('[data-directory-filters]');
const grid = document.querySelector<HTMLElement>('[data-listing-grid]');

if (form && grid) initDirectory(form, grid);

function initDirectory(form: HTMLFormElement, grid: HTMLElement) {
  const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-listing]'));
  const total = items.length;
  const results = document.querySelector<HTMLElement>('[data-results]')!;
  const count = document.querySelector<HTMLElement>('[data-results-count]')!;
  const emptyState = document.querySelector<HTMLElement>('[data-results-empty]')!;
  const noneState = document.querySelector<HTMLElement>('[data-results-none]')!;
  const loading = document.querySelector<HTMLElement>('[data-results-loading]')!;
  const chips = document.querySelector<HTMLElement>('[data-chips]')!;
  const chipIcon = document.querySelector<HTMLTemplateElement>('#chip-icon');
  const panel = form.querySelector<HTMLElement>('[data-filters-panel]')!;
  const toggle = form.querySelector<HTMLButtonElement>('[data-filters-toggle]')!;
  const filterCount = form.querySelector<HTMLElement>('[data-filter-count]')!;
  const searchInput = form.querySelector<HTMLInputElement>('[name="q"]')!;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;

  // Preview the loading and no-listings states for review: ?preview=loading | ?preview=empty
  const preview = new URLSearchParams(location.search).get('preview');
  if (preview === 'loading' || preview === 'empty' || total === 0) {
    grid.hidden = true;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button').forEach(
      (el) => (el.disabled = true),
    );
    if (preview === 'loading') {
      loading.hidden = false;
      results.setAttribute('aria-busy', 'true');
      count.textContent = 'Loading listings…';
    } else {
      noneState.hidden = false;
      count.textContent = 'No businesses are listed right now';
    }
    return;
  }

  const readState = (): State => {
    const state = { sort: field('sort')?.value || DEFAULT_SORT } as State;
    for (const key of FILTER_KEYS) state[key] = (field(key)?.value ?? '').trim();
    return state;
  };

  const writeState = (params: URLSearchParams) => {
    for (const key of [...FILTER_KEYS, 'sort']) {
      const el = field(key);
      if (!el) continue;
      const value = params.get(key) ?? '';
      // Ignore values that aren't valid options (e.g. a stale shared link).
      if (el instanceof HTMLSelectElement && !Array.from(el.options).some((o) => o.value === value)) {
        el.value = key === 'sort' ? DEFAULT_SORT : '';
      } else {
        el.value = value || (key === 'sort' ? DEFAULT_SORT : '');
      }
    }
  };

  const matches = (li: HTMLElement, state: State, terms: string[]) => {
    const d = li.dataset;
    if (state.industry && d.industry !== state.industry) return false;
    if (state.state && d.state !== state.state) return false;
    if (state.status && d.status !== state.status) return false;
    if (state.revenue) {
      const bucket = REVENUE_BUCKETS.find((b) => b.id === state.revenue);
      if (bucket && !inBucket(Number(d.revenue), bucket)) return false;
    }
    if (state.price) {
      if (state.price === PRICE_UNDISCLOSED.id) {
        if (d.price) return false;
      } else {
        const bucket = PRICE_BUCKETS.find((b) => b.id === state.price);
        if (bucket && (!d.price || !inBucket(Number(d.price), bucket))) return false;
      }
    }
    if (state.size) {
      const bucket = SIZE_BUCKETS.find((b) => b.id === state.size);
      if (bucket && !inBucket(Number(d.size), bucket)) return false;
    }
    if (terms.length) {
      const haystack = d.search ?? '';
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  };

  const compare = (sort: string) => {
    const num = (li: HTMLElement, key: 'revenue' | 'price') => (li.dataset[key] ? Number(li.dataset[key]) : null);
    return (a: HTMLElement, b: HTMLElement) => {
      switch (sort) {
        case 'revenue-desc':
          return num(b, 'revenue')! - num(a, 'revenue')!;
        case 'revenue-asc':
          return num(a, 'revenue')! - num(b, 'revenue')!;
        case 'price-desc':
        case 'price-asc': {
          const pa = num(a, 'price');
          const pb = num(b, 'price');
          // Undisclosed prices always sort last.
          if (pa === null || pb === null) return pa === pb ? 0 : pa === null ? 1 : -1;
          return sort === 'price-asc' ? pa - pb : pb - pa;
        }
        default:
          return (b.dataset.listed ?? '').localeCompare(a.dataset.listed ?? '');
      }
    };
  };

  const optionLabel = (key: FilterKey, value: string) => {
    if (key === 'q') return `“${value}”`;
    const el = field(key);
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent?.trim() ?? value;
    return value;
  };

  const renderChips = (state: State) => {
    const active = FILTER_KEYS.filter((key) => state[key]);
    chips.replaceChildren(
      ...active.map((key) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        const text = `${FILTER_LABELS[key]}: ${optionLabel(key, state[key])}`;
        btn.setAttribute('aria-label', `Remove filter ${text}`);
        btn.append(text);
        if (chipIcon) btn.append(chipIcon.content.cloneNode(true));
        btn.addEventListener('click', () => {
          const el = field(key);
          if (el) el.value = '';
          apply({ announce: true, animate: true }).then(() =>
            (key === 'q' ? searchInput : (chips.querySelector('button') ?? count)).focus(),
          );
        });
        li.append(btn);
        return li;
      }),
    );
    chips.hidden = active.length === 0;
    const panelFilters = active.filter((key) => key !== 'q').length;
    filterCount.textContent = String(panelFilters);
    filterCount.hidden = panelFilters === 0;
    toggle.setAttribute('aria-label', panelFilters ? `Filters, ${panelFilters} applied` : 'Filters');
  };

  // Cards glide to their new positions when filters change (View Transitions API, where supported).
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const withTransition = (update: () => void): Promise<void> => {
    if (reduceMotion || !document.startViewTransition) {
      update();
      return Promise.resolve();
    }
    items.forEach((li) => (li.style.viewTransitionName = `card-${li.dataset.id}`));
    const transition = document.startViewTransition(update);
    transition.finished.finally(() => items.forEach((li) => (li.style.viewTransitionName = '')));
    return transition.updateCallbackDone.catch(() => undefined);
  };

  let announceTimer: number | undefined;
  const apply = ({ announce = false, syncUrl = true, animate = false } = {}) => {
    // The load-in stagger should only run once; filtering re-shows cards without it.
    if (announce) grid.classList.remove('stagger');
    const state = readState();
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const visible = items.filter((li) => matches(li, state, terms)).sort(compare(state.sort));
    const visibleSet = new Set(visible);

    const update = () => {
      grid.append(...visible, ...items.filter((li) => !visibleSet.has(li)));
      for (const li of items) li.hidden = !visibleSet.has(li);
      grid.hidden = visible.length === 0;
      emptyState.hidden = visible.length !== 0;
      renderChips(state);
    };
    // Typing in search updates instantly: a transition would freeze the input's snapshot mid-keystroke.
    let done: Promise<void> = Promise.resolve();
    if (animate) done = withTransition(update);
    else update();

    const message =
      visible.length === 0
        ? 'No listings match your filters'
        : visible.length === total
          ? `Showing all ${total} sample listings`
          : `Showing ${visible.length} of ${total} sample listings`;
    // Delay announcements slightly so typing doesn't trigger a stream of updates.
    window.clearTimeout(announceTimer);
    if (announce) announceTimer = window.setTimeout(() => (count.textContent = message), 250);
    else count.textContent = message;

    if (syncUrl) {
      const params = new URLSearchParams();
      for (const key of FILTER_KEYS) if (state[key]) params.set(key, state[key]);
      if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
      const query = params.toString();
      history.replaceState(null, '', query ? `?${query}` : location.pathname);
    }
    return done;
  };

  const reset = () => {
    form.reset();
    const sort = field('sort');
    if (sort) sort.value = DEFAULT_SORT;
    apply({ announce: true, animate: true });
  };

  // Restore state from a shared link.
  writeState(new URLSearchParams(location.search));
  apply({ syncUrl: false });

  let searchTimer: number | undefined;
  form.addEventListener('input', (event) => {
    if (event.target !== searchInput) return;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => apply({ announce: true }), 150);
  });
  form.addEventListener('change', (event) => {
    if (event.target === searchInput) return;
    apply({ announce: true, animate: true });
  });
  // The sort control sits outside the <form> element (linked via form="filters"), so its events
  // don't bubble to the form.
  const sortSelect = field('sort');
  if (sortSelect && !form.contains(sortSelect)) {
    sortSelect.addEventListener('change', () => apply({ announce: true, animate: true }));
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    apply({ announce: true });
  });

  document.querySelectorAll('[data-reset-filters]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const inEmptyState = emptyState.contains(btn);
      reset();
      if (inEmptyState) count.focus();
    }),
  );

  // Mobile: filters live in a collapsible panel.
  const setOpen = (open: boolean) => {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  form.querySelector('[data-filters-done]')?.addEventListener('click', () => {
    setOpen(false);
    toggle.focus();
    results.scrollIntoView({ block: 'start' });
  });

  window.addEventListener('popstate', () => {
    writeState(new URLSearchParams(location.search));
    apply({ syncUrl: false });
  });
}
