// Listing data.
//
// EVERY RECORD BELOW IS FICTIONAL SAMPLE DATA (isSample: true) created for layout and interaction
// testing. None of these businesses, figures or addresses are real opportunities.
//
// To go live, replace SAMPLE_LISTINGS with approved listings (or load them from a CMS/CRM) using the
// same `Listing` shape. Pages only ever receive listings through `toPublicListing()` in
// src/lib/listings.ts, which strips anything the listing has not been approved to show publicly.
// Real private details (seller identity, exact address, financial statements) should live in a CRM
// or backend behind the NDA step — not in this repository.

export type ListingStatus = 'active' | 'under-loi' | 'under-contract' | 'sold';

/**
 * How much of the location the public can see.
 * - 'region'  (default) the broker-written area label only, e.g. "Central Texas"
 * - 'partial' city, state and ZIP code
 * - 'exact'   full street address — only when the seller has explicitly approved it
 */
export type AddressVisibility = 'region' | 'partial' | 'exact';

export type EarningsKind = 'SDE' | 'EBITDA' | 'Cash flow';

export interface Listing {
  id: string;
  slug: string;
  isSample: boolean;
  /** Anonymized headline — never the trading name unless approved. */
  title: string;
  industry: string;
  location: {
    /** Public area label written by the broker, e.g. "Central Texas". */
    area: string;
    city: string;
    /** Two-letter US state code. */
    state: string;
  };
  addressVisibility: AddressVisibility;
  /** Private. Rendered only when addressVisibility is 'exact' (street) or 'partial' (ZIP). */
  privateAddress?: { street: string; postalCode: string };
  /** Annual revenue, USD. */
  revenue: number;
  earnings?: { kind: EarningsKind; amount: number };
  askingPrice?: number;
  /** Asking price is shown only when the seller has approved public display. */
  showAskingPrice: boolean;
  employees: { min: number; max: number };
  yearsOperating?: number;
  overview: string;
  strengths?: string[];
  growthOpportunities?: string[];
  status: ListingStatus;
  /** ISO date the listing went live. */
  listedAt: string;
}

export const SAMPLE_LISTINGS: Listing[] = [
  {
    id: 'demo-001',
    slug: 'sample-residential-hvac-central-texas',
    isSample: true,
    title: 'Established Residential HVAC Service Company',
    industry: 'Home Services',
    location: { area: 'Central Texas', city: 'Austin', state: 'TX' },
    addressVisibility: 'region',
    privateAddress: { street: '4100 Demo Ridge Road', postalCode: '78701' },
    revenue: 2_850_000,
    earnings: { kind: 'SDE', amount: 640_000 },
    askingPrice: 1_950_000,
    showAskingPrice: true,
    employees: { min: 14, max: 18 },
    yearsOperating: 19,
    overview:
      'Owner-led residential heating and cooling company with a maintenance-plan base, a small fleet of service vans and a trained install crew. The owner currently handles estimating for larger replacement jobs.',
    strengths: [
      'Recurring maintenance-plan customers',
      'Experienced technicians with long tenure',
      'Strong local reviews and referral flow',
    ],
    growthOpportunities: ['Add light-commercial service', 'Formalize online booking and follow-up'],
    status: 'active',
    listedAt: '2026-10-14',
  },
  {
    id: 'demo-002',
    slug: 'sample-commercial-janitorial-phoenix',
    isSample: true,
    title: 'Commercial Janitorial Contractor with Recurring Contracts',
    industry: 'Business Services',
    location: { area: 'Phoenix Metro', city: 'Phoenix', state: 'AZ' },
    addressVisibility: 'region',
    privateAddress: { street: '2250 Sample Commerce Way', postalCode: '85004' },
    revenue: 2_200_000,
    earnings: { kind: 'SDE', amount: 385_000 },
    askingPrice: 1_050_000,
    showAskingPrice: true,
    employees: { min: 45, max: 60 },
    yearsOperating: 11,
    overview:
      'Night-shift cleaning for offices, medical suites and light industrial sites under monthly service agreements. Operations are run by two field supervisors with the owner focused on sales.',
    strengths: ['Monthly recurring agreements', 'Supervisors in place', 'Diversified client base'],
    growthOpportunities: ['Day porter and floor-care add-ons', 'Expansion into adjacent suburbs'],
    status: 'active',
    listedAt: '2026-10-09',
  },
  {
    id: 'demo-003',
    slug: 'sample-precision-machining-ohio',
    isSample: true,
    title: 'Precision CNC Machining and Fabrication Shop',
    industry: 'Manufacturing',
    location: { area: 'Southwest Ohio', city: 'Dayton', state: 'OH' },
    addressVisibility: 'region',
    privateAddress: { street: '880 Example Industrial Parkway', postalCode: '45402' },
    revenue: 6_400_000,
    earnings: { kind: 'EBITDA', amount: 1_150_000 },
    showAskingPrice: false,
    employees: { min: 32, max: 40 },
    yearsOperating: 34,
    overview:
      'Second-generation job shop producing tight-tolerance components for industrial and equipment customers. Owned facility available for lease or purchase alongside the business.',
    strengths: ['Long-standing customer relationships', 'Modern multi-axis equipment', 'Quality certifications in place'],
    growthOpportunities: ['Add a second shift', 'Pursue adjacent aerospace and medical work'],
    status: 'under-loi',
    listedAt: '2026-08-21',
  },
  {
    id: 'demo-004',
    slug: 'sample-online-kitchenware-brand',
    isSample: true,
    title: 'Online Specialty Kitchenware Brand',
    industry: 'E-commerce',
    location: { area: 'Denver Metro (remote-operable)', city: 'Denver', state: 'CO' },
    addressVisibility: 'region',
    revenue: 1_750_000,
    earnings: { kind: 'SDE', amount: 410_000 },
    askingPrice: 1_150_000,
    showAskingPrice: true,
    employees: { min: 3, max: 5 },
    yearsOperating: 7,
    overview:
      'Direct-to-consumer brand selling its own designs through a branded store and two marketplaces. Fulfillment is outsourced to a third-party warehouse.',
    strengths: ['Proprietary product designs', 'Repeat-customer email list', 'Lean, remote team'],
    growthOpportunities: ['Wholesale to independent retailers', 'Expand the product line into bakeware'],
    status: 'active',
    listedAt: '2026-10-01',
  },
  {
    id: 'demo-005',
    slug: 'sample-wholesale-bakery-cafe-asheville',
    isSample: true,
    title: 'Wholesale Bakery with Café Storefront',
    industry: 'Food & Beverage',
    location: { area: 'Western North Carolina', city: 'Asheville', state: 'NC' },
    addressVisibility: 'exact',
    privateAddress: { street: '000 Sample Street (fictional)', postalCode: '28801' },
    revenue: 980_000,
    earnings: { kind: 'SDE', amount: 205_000 },
    askingPrice: 495_000,
    showAskingPrice: true,
    employees: { min: 11, max: 14 },
    yearsOperating: 12,
    overview:
      'Scratch bakery supplying local restaurants and grocers, with a busy café storefront. This sample uses the "exact" address setting to show how an approved public address displays.',
    strengths: ['Wholesale accounts plus retail traffic', 'Documented recipes and production schedule'],
    growthOpportunities: ['Extend café hours', 'Add regional grocery accounts'],
    status: 'active',
    listedAt: '2026-09-26',
  },
  {
    id: 'demo-006',
    slug: 'sample-managed-it-services-tampa',
    isSample: true,
    title: 'Managed IT Services Provider (MSP)',
    industry: 'Technology',
    location: { area: 'Tampa Bay', city: 'Tampa', state: 'FL' },
    addressVisibility: 'region',
    privateAddress: { street: '1500 Placeholder Boulevard', postalCode: '33602' },
    revenue: 3_600_000,
    earnings: { kind: 'EBITDA', amount: 720_000 },
    askingPrice: 3_100_000,
    showAskingPrice: true,
    employees: { min: 18, max: 22 },
    yearsOperating: 15,
    overview:
      'Provides outsourced IT support, cybersecurity and cloud management to small and mid-sized businesses on monthly contracts.',
    strengths: ['Contracted monthly revenue', 'Certified technical team', 'Low client churn'],
    growthOpportunities: ['Package compliance services', 'Hire a dedicated salesperson'],
    status: 'under-contract',
    listedAt: '2026-07-30',
  },
  {
    id: 'demo-007',
    slug: 'sample-auto-repair-fleet-nashville',
    isSample: true,
    title: 'Independent Auto Repair and Fleet Service Shop',
    industry: 'Automotive',
    location: { area: 'Middle Tennessee', city: 'Nashville', state: 'TN' },
    addressVisibility: 'partial',
    privateAddress: { street: '3300 Demo Pike', postalCode: '37211' },
    revenue: 1_450_000,
    earnings: { kind: 'SDE', amount: 330_000 },
    askingPrice: 875_000,
    showAskingPrice: true,
    employees: { min: 7, max: 9 },
    yearsOperating: 22,
    overview:
      'Eight-bay general repair shop serving retail customers and several local service fleets. This sample uses the "partial" address setting (city, state and ZIP).',
    strengths: ['Fleet accounts provide steady volume', 'ASE-certified technicians', 'Well-maintained equipment'],
    growthOpportunities: ['Add EV and hybrid service', 'Extend Saturday hours'],
    status: 'active',
    listedAt: '2026-10-18',
  },
  {
    id: 'demo-008',
    slug: 'sample-pet-grooming-boarding-atlanta',
    isSample: true,
    title: 'Pet Grooming and Boarding Facility',
    industry: 'Consumer Services',
    location: { area: 'Metro Atlanta', city: 'Marietta', state: 'GA' },
    addressVisibility: 'region',
    privateAddress: { street: '725 Example Lane', postalCode: '30060' },
    revenue: 720_000,
    earnings: { kind: 'SDE', amount: 190_000 },
    askingPrice: 425_000,
    showAskingPrice: true,
    employees: { min: 9, max: 12 },
    yearsOperating: 9,
    overview:
      'Appointment-based grooming salon with overnight boarding and daycare. Booked through online scheduling with a loyal repeat clientele.',
    strengths: ['High repeat-visit rate', 'Online booking system', 'Trained grooming team'],
    growthOpportunities: ['Retail pet products', 'Mobile grooming van'],
    status: 'active',
    listedAt: '2026-09-12',
  },
  {
    id: 'demo-009',
    slug: 'sample-electrical-contractor-utah',
    isSample: true,
    title: 'Licensed Electrical Contractor, Commercial and Residential',
    industry: 'Construction & Trades',
    location: { area: 'Wasatch Front', city: 'Salt Lake City', state: 'UT' },
    addressVisibility: 'region',
    privateAddress: { street: '5150 Sample Industrial Drive', postalCode: '84101' },
    revenue: 4_900_000,
    earnings: { kind: 'EBITDA', amount: 880_000 },
    askingPrice: 3_400_000,
    showAskingPrice: true,
    employees: { min: 28, max: 35 },
    yearsOperating: 26,
    overview:
      'Electrical contractor handling tenant improvements, service work and new residential builds. Project managers run day-to-day jobs.',
    strengths: ['Builder and property-manager relationships', 'Licensed journeymen on staff', 'Project managers in place'],
    growthOpportunities: ['EV-charger and solar installations', 'Service-agreement program'],
    status: 'active',
    listedAt: '2026-09-05',
  },
  {
    id: 'demo-010',
    slug: 'sample-early-learning-center-boise',
    isSample: true,
    title: 'Early Learning and Childcare Center',
    industry: 'Education & Childcare',
    location: { area: 'Treasure Valley', city: 'Boise', state: 'ID' },
    addressVisibility: 'region',
    privateAddress: { street: '410 Example Court', postalCode: '83702' },
    revenue: 1_300_000,
    earnings: { kind: 'SDE', amount: 260_000 },
    askingPrice: 690_000,
    showAskingPrice: true,
    employees: { min: 20, max: 24 },
    yearsOperating: 14,
    overview:
      'Licensed childcare center serving infants through pre-K, with a director managing staff and enrollment. Included to show how a sold listing appears.',
    strengths: ['Waitlist for infant rooms', 'Experienced center director'],
    status: 'sold',
    listedAt: '2026-06-17',
  },
  {
    id: 'demo-011',
    slug: 'sample-last-mile-delivery-dallas',
    isSample: true,
    title: 'Regional Last-Mile Delivery Operator',
    industry: 'Transportation & Logistics',
    location: { area: 'Dallas–Fort Worth', city: 'Irving', state: 'TX' },
    addressVisibility: 'region',
    privateAddress: { street: '9000 Demo Logistics Road', postalCode: '75038' },
    revenue: 8_200_000,
    earnings: { kind: 'EBITDA', amount: 1_400_000 },
    showAskingPrice: false,
    employees: { min: 70, max: 90 },
    yearsOperating: 10,
    overview:
      'Same-day and next-day delivery for retailers and distributors across the metroplex, operating a leased van fleet from a cross-dock facility.',
    strengths: ['Contracted retail customers', 'Route-optimization software', 'Dispatch team in place'],
    growthOpportunities: ['Add a second metro hub', 'Temperature-controlled delivery'],
    status: 'active',
    listedAt: '2026-10-22',
  },
  {
    id: 'demo-012',
    slug: 'sample-physical-therapy-clinic-sacramento',
    isSample: true,
    title: 'Outpatient Physical Therapy Clinic',
    industry: 'Health & Wellness',
    location: { area: 'Greater Sacramento', city: 'Roseville', state: 'CA' },
    addressVisibility: 'region',
    privateAddress: { street: '1200 Sample Health Plaza', postalCode: '95661' },
    revenue: 1_150_000,
    earnings: { kind: 'SDE', amount: 295_000 },
    askingPrice: 760_000,
    showAskingPrice: true,
    employees: { min: 8, max: 10 },
    yearsOperating: 8,
    overview:
      'Orthopedic and sports-rehab clinic with established physician referral sources and in-network payer contracts.',
    strengths: ['Physician referral relationships', 'Modern treatment space', 'Associate therapists on staff'],
    growthOpportunities: ['Add a second location', 'Cash-pay wellness programs'],
    status: 'active',
    listedAt: '2026-08-08',
  },
];
