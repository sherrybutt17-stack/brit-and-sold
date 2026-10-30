// Filter buckets and sort options for the business directory (USD).
// Shared by the server-rendered filter form and the client-side filtering script.

export interface RangeBucket {
  id: string;
  label: string;
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound; omit for open-ended. */
  max?: number;
}

export const REVENUE_BUCKETS: RangeBucket[] = [
  { id: 'under-500k', label: 'Under $500K', min: 0, max: 500_000 },
  { id: '500k-1m', label: '$500K – $1M', min: 500_000, max: 1_000_000 },
  { id: '1m-3m', label: '$1M – $3M', min: 1_000_000, max: 3_000_000 },
  { id: '3m-10m', label: '$3M – $10M', min: 3_000_000, max: 10_000_000 },
  { id: '10m-plus', label: '$10M+', min: 10_000_000 },
];

export const PRICE_BUCKETS: RangeBucket[] = [
  { id: 'under-500k', label: 'Under $500K', min: 0, max: 500_000 },
  { id: '500k-1m', label: '$500K – $1M', min: 500_000, max: 1_000_000 },
  { id: '1m-2m', label: '$1M – $2M', min: 1_000_000, max: 2_000_000 },
  { id: '2m-5m', label: '$2M – $5M', min: 2_000_000, max: 5_000_000 },
  { id: '5m-plus', label: '$5M+', min: 5_000_000 },
];

/** Extra asking-price option for listings whose price is not shown publicly. */
export const PRICE_UNDISCLOSED = { id: 'on-request', label: 'Price on request' } as const;

/** Employee-count buckets; a listing matches every bucket its employee range overlaps. */
export const SIZE_BUCKETS: RangeBucket[] = [
  { id: '1-10', label: '1 – 10 employees', min: 1, max: 11 },
  { id: '11-25', label: '11 – 25 employees', min: 11, max: 26 },
  { id: '26-50', label: '26 – 50 employees', min: 26, max: 51 },
  { id: '51-100', label: '51 – 100 employees', min: 51, max: 101 },
  { id: '100-plus', label: '101+ employees', min: 101 },
];

export const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'under-loi', label: 'Under LOI' },
  { id: 'under-contract', label: 'Under contract' },
  { id: 'sold', label: 'Sold' },
] as const;

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'revenue-desc', label: 'Revenue: high to low' },
  { id: 'revenue-asc', label: 'Revenue: low to high' },
  { id: 'price-desc', label: 'Asking price: high to low' },
  { id: 'price-asc', label: 'Asking price: low to high' },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]['id'];

export function inBucket(value: number, bucket: RangeBucket): boolean {
  return value >= bucket.min && (bucket.max === undefined || value < bucket.max);
}

/** True when the inclusive range [min, max] shares at least one value with the bucket. */
export function rangeInBucket(min: number, max: number, bucket: RangeBucket): boolean {
  return max >= bucket.min && (bucket.max === undefined || min < bucket.max);
}
