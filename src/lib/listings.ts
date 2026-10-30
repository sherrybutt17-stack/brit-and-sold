import { SAMPLE_LISTINGS, type AddressVisibility, type EarningsKind, type Listing, type ListingStatus } from '../data/listings';
import { US_STATES } from '../data/us';

/**
 * The only listing shape pages and components may render.
 * Built by `toPublicListing()`, which drops private fields the listing is not approved to show.
 */
export interface PublicListing {
  id: string;
  slug: string;
  isSample: boolean;
  title: string;
  industry: string;
  /** Location text exactly as the public may see it. */
  locationLabel: string;
  /** Area or city and state, never a street address. For summaries such as meta descriptions. */
  placeLabel: string;
  addressVisibility: AddressVisibility;
  state: string;
  revenue: number;
  earnings?: { kind: EarningsKind; amount: number };
  /** null when the asking price is not approved for public display. */
  askingPrice: number | null;
  employees: { min: number; max: number };
  yearsOperating?: number;
  overview: string;
  strengths: string[];
  growthOpportunities: string[];
  status: ListingStatus;
  listedAt: string;
}

export const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  'under-loi': 'Under LOI',
  'under-contract': 'Under contract',
  sold: 'Sold',
};

export const EARNINGS_LABELS: Record<EarningsKind, string> = {
  SDE: 'Seller’s discretionary earnings',
  EBITDA: 'EBITDA',
  'Cash flow': 'Cash flow',
};

/** Spelled-out meanings for the abbreviations on listing cards. */
export const EARNINGS_EXPANSIONS: Partial<Record<EarningsKind, string>> = {
  SDE: 'Seller’s discretionary earnings',
  EBITDA: 'Earnings before interest, taxes, depreciation and amortization',
};

export function formatLocation(listing: Listing): string {
  const { location, privateAddress, addressVisibility } = listing;
  if (addressVisibility === 'exact' && privateAddress) {
    return `${privateAddress.street}, ${location.city}, ${location.state} ${privateAddress.postalCode}`;
  }
  if (addressVisibility === 'partial') {
    const zip = privateAddress?.postalCode ? ` ${privateAddress.postalCode}` : '';
    return `${location.city}, ${location.state}${zip}`;
  }
  return areaLabel(listing);
}

/** The broker-written area, plus the state unless the area already names it ("Central Texas", not "Central Texas, TX"). */
function areaLabel({ location }: Listing): string {
  const stateName = US_STATES.find((s) => s.code === location.state)?.name;
  return stateName && location.area.includes(stateName) ? location.area : `${location.area}, ${location.state}`;
}

function placeLabel(listing: Listing): string {
  return listing.addressVisibility === 'region' ? areaLabel(listing) : `${listing.location.city}, ${listing.location.state}`;
}

export function toPublicListing(listing: Listing): PublicListing {
  return {
    id: listing.id,
    slug: listing.slug,
    isSample: listing.isSample,
    title: listing.title,
    industry: listing.industry,
    locationLabel: formatLocation(listing),
    placeLabel: placeLabel(listing),
    addressVisibility: listing.addressVisibility,
    state: listing.location.state,
    revenue: listing.revenue,
    earnings: listing.earnings,
    askingPrice: listing.showAskingPrice && listing.askingPrice !== undefined ? listing.askingPrice : null,
    employees: listing.employees,
    yearsOperating: listing.yearsOperating,
    overview: listing.overview,
    strengths: listing.strengths ?? [],
    growthOpportunities: listing.growthOpportunities ?? [],
    status: listing.status,
    listedAt: listing.listedAt,
  };
}

/** All public listings, newest first. */
export function getPublicListings(): PublicListing[] {
  return SAMPLE_LISTINGS.map(toPublicListing).sort((a, b) => b.listedAt.localeCompare(a.listedAt));
}

const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});
const usdFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatUSD(value: number, { compact = true } = {}): string {
  return (compact ? usdCompact : usdFull).format(value);
}

export function formatEmployees({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min}` : `${min}–${max}`;
}


export function formatListedDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
