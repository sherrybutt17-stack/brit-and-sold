// Single source of truth for brand copy, navigation and the facts the owner still needs to supply.
// Facts set to `null` in OWNER_FACTS are simply left off the site until they are filled in.

import { url } from '../lib/url';

export const BRAND = {
  name: 'Build and Sold with Rob Dawson',
  short: 'Build and Sold',
  person: 'Rob Dawson',
} as const;

/** While true: sample listings are labelled, forms are mocks, and pages are marked noindex. */
export const IS_DEMO = true;

export const NAV = [
  { href: url('/businesses'), label: 'Browse Businesses' },
  { href: url('/sell'), label: 'Sell Your Business' },
  { href: url('/about'), label: 'About Rob' },
] as const;

export const CTA = {
  sell: { href: url('/sell#inquiry'), label: 'Talk About Selling' },
  browse: { href: url('/businesses'), label: 'Browse Businesses' },
} as const;

type OwnerFact = string | null;

// SAMPLE VALUES for the mockup (owner request, 2026-10-28). Replace each with Rob's real details before launch.
// Deliberately left unset: credentials, licensing and track record are never invented for a real person.
export const OWNER_FACTS: Record<
  | 'email'
  | 'phone'
  | 'bookingUrl'
  | 'serviceArea'
  | 'focus'
  | 'responseTime'
  | 'licensing'
  | 'fees'
  | 'timeline'
  | 'origin'
  | 'privacyPolicyUrl',
  OwnerFact
> = {
  email: 'hello@buildandsold.example', // .example is a reserved, non-routable domain
  phone: '(555) 010-0142', // 555-01xx numbers are reserved for fictional use
  bookingUrl: null,
  serviceArea: 'Business owners across the United States',
  focus: 'Owner-operated businesses with roughly $500K to $10M in annual revenue',
  responseTime: 'within one business day',
  licensing: null,
  fees: 'Typically a success fee paid at closing, agreed in writing before your business is marketed.',
  timeline: 'Usually six to twelve months from first conversation to closing',
  origin:
    'Build and Sold exists for owners who want an honest read on their options and a discreet, well-run process, whether they sell next quarter or in five years.',
  privacyPolicyUrl: null,
};

/** Public links that already exist on robdawson.tv. */
export const ROB_LINKS = {
  website: 'https://robdawson.tv/',
  linkedin: 'https://www.linkedin.com/in/robertsdawson/',
} as const;

/**
 * Outline of a typical sell-side brokerage engagement.
 * Generic industry practice, not yet confirmed by Rob — review wording, order and detail before launch.
 */
export const PROCESS_STEPS = [
  {
    title: 'A private first conversation',
    summary: 'Your goals, your timing and the business at a high level. No documents and no commitment.',
    detail:
      'We talk about why you are thinking about selling, what you want life to look like afterwards, and whether a sale is the right move now, later or not at all.',
  },
  {
    title: 'Review and value discussion',
    summary: 'A look at the numbers and what is likely to drive a buyer’s offer.',
    detail:
      'If it makes sense to continue, we review your financials together and talk candidly about how buyers are likely to see the business, and what that means for price expectations.',
  },
  {
    title: 'Preparation',
    summary: 'Getting ready for the questions buyers will ask before they ask them.',
    detail:
      'We gather what serious buyers will request, tidy up loose ends, and prepare an anonymized summary and a confidential information memorandum.',
  },
  {
    title: 'Discreet marketing and buyer screening',
    summary: 'Your business is presented without its name. Buyers are vetted before they learn more.',
    detail:
      'Interested buyers are asked about their background, funding and plans, and sign a non-disclosure agreement before receiving identifying details.',
  },
  {
    title: 'Offers, diligence and closing',
    summary: 'Comparing offers, working through due diligence and getting to the finish line.',
    detail:
      'Offers usually arrive as a letter of intent. The chosen buyer completes due diligence while your attorney and accountant work with theirs to finalize the deal.',
  },
] as const;
