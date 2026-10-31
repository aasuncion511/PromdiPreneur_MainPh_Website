/**
 * Brand facts and every outbound destination. Single source of truth: pages and components read from here.
 * Brand rules: docs/BRAND_STANDARD.md (V2.0 governance — retired legacy naming, no prices on the hub).
 */

export const BRAND = {
  name: 'PromdiPreneur',
  role: 'Business Systems & Automation Implementer',
  tagline: 'FROM DISKARTE TO SYSTEMS.',
  principle: ['Business first', 'Systems second', 'Technology third'],
  serviceFamily: 'PromdiPreneur Systems',
  phases: ['Review', 'Build', 'Improve'],
  promise:
    'We help business owners organize how work gets done, build practical tools and workflows, and implement systems that reduce missed opportunities and unnecessary manual work.',
  email: 'admin@promdipreneur.com',
  location: 'Cagayan de Oro, Philippines',
  founder: 'Allan',
} as const;

export const CTA = {
  // v3 §3/§4: global primary CTA = Discovery Session; secondary = explore what we build.
  primary: 'Book a Free Discovery Call',
  primaryShort: 'Free Discovery Call',
  explore: 'Explore What We Can Build',
  inquiry: 'Ask Us About Your Business',
  store: 'Browse the Digital Store',
  ebook: 'Get Free Guide',
} as const;

/** Free lead-magnet ebook (Final Ebook Addendum §1). Title/subtitle/author exactly as on the cover. */
export const EBOOK = {
  title: 'The Business Opening Checklist PH',
  subtitle: '109 Practical Checks to Help You Plan, Open & Run Your Business with Confidence',
  author: 'Allan Asuncion',
  authorRole: 'Business Systems & Automation Implementer',
  route: '/resources/free-ebook',
  /** Owner-controlled stable URL (Astro public/). The file must exist before FEATURES.ebookLive can be true. */
  pdfPath: '/resources/promdipreneur-business-opening-checklist-ph.pdf',
  leadMagnetName: 'The Business Opening Checklist PH',
  ghlTag: 'LM | Ebook',
  stages: [
    'Before You Register',
    'Navigate Business Registration',
    'Before You Rent',
    'Capital & Logistics',
    'Before You Hire',
    'Before You Sell',
    'Before You Spend Your First Peso',
  ],
} as const;

/**
 * Destination registry (handoff v1.1 §34). Each outbound link is referenced by id, never by a hardcoded URL.
 * `status`: verified = opened and checked on the date; unverified = could not be checked from the build environment;
 * pending = not yet supplied/approved (rendered as an inactive state, never as a dead link).
 */
export type DestinationId =
  | 'shop'
  | 'payroll'
  | 'payrollDemo'
  | 'kits'
  | 'portfolio'
  | 'facebook'
  | 'messenger'
  | 'email'
  | 'discoveryBooking';

export interface Destination {
  url: string | null;
  label: string;
  event: string;
  kind: 'ghl-store' | 'ghl-funnel' | 'site' | 'social' | 'mailto' | 'ghl-calendar';
  forwardUtm: boolean;
  status: 'verified' | 'unverified' | 'pending';
  verifiedAt?: string;
  note?: string;
}

export const DESTINATIONS: Record<DestinationId, Destination> = {
  shop: {
    // v3 §3: the live commerce destination. Linked from the shop's own navigation (checked 2026-10-30).
    url: 'https://shop.promdipreneur.com/products-list',
    label: 'PromdiPreneur Digital Shop',
    event: 'outbound_shop_click',
    kind: 'ghl-store',
    forwardUtm: true,
    status: 'verified',
    verifiedAt: '2026-10-30',
  },
  payroll: {
    url: 'https://payroll.promdipreneur.com/',
    label: 'PromdiPreneur Payroll',
    event: 'outbound_payroll_click',
    kind: 'ghl-funnel',
    forwardUtm: true,
    status: 'verified',
    verifiedAt: '2026-10-30',
  },
  payrollDemo: {
    url: 'https://payroll.promdipreneur.com/payroll-demo',
    label: 'PromdiPreneur Payroll live demo',
    event: 'outbound_payroll_click',
    kind: 'ghl-funnel',
    forwardUtm: true,
    status: 'verified',
    verifiedAt: '2026-10-30',
    note: 'Linked from the live payroll page ("Open the live demo").',
  },
  kits: {
    url: 'https://kits.promdipreneur.com/',
    label: 'Cleaning Business Kits',
    event: 'outbound_cleaning_kits_click',
    kind: 'ghl-funnel',
    forwardUtm: true,
    status: 'verified',
    verifiedAt: '2026-10-30',
  },
  portfolio: {
    url: 'https://portfolio.promdipreneur.com/',
    label: 'International portfolio',
    event: 'outbound_portfolio_click',
    kind: 'site',
    forwardUtm: false,
    status: 'verified',
    verifiedAt: '2026-10-30',
  },
  facebook: {
    url: 'https://www.facebook.com/Promdipreneur',
    label: 'PromdiPreneur on Facebook',
    event: 'contact_messenger_click',
    kind: 'social',
    forwardUtm: false,
    status: 'unverified',
    note: 'facebook.com is blocked from the build environment. Allan to confirm.',
  },
  messenger: {
    // Homepage v2 handoff §5 (Allan, 2026-11-01): Messenger links go to m.me/Promdipreneur.
    url: 'https://m.me/Promdipreneur',
    label: 'Message us on Messenger',
    event: 'contact_messenger_click',
    kind: 'social',
    forwardUtm: false,
    status: 'verified',
  },
  email: {
    url: 'mailto:admin@promdipreneur.com?subject=Business%20question',
    label: 'admin@promdipreneur.com',
    event: 'contact_email_click',
    kind: 'mailto',
    forwardUtm: false,
    status: 'verified',
  },
  discoveryBooking: {
    // TODO: VERIFY — the PH Discovery Session calendar URL is not supplied (v3 §3: never invent a booking URL). The portfolio's booking widget is for international
    // project introductions and is deliberately NOT reused here. Set the GHL calendar URL to activate.
    url: null,
    label: 'Book a Business Systems Discovery call',
    event: 'diagnostic_booking_click',
    kind: 'ghl-calendar',
    forwardUtm: true,
    status: 'pending',
  },
};

/** Launch switches. Everything that depends on an unapproved asset or credential stays off until flipped. */
export const FEATURES = {
  /**
   * Free ebook capture + delivery. Keep false until ALL are done (docs/EBOOK.md → Activation):
   * PDF placed at public + EBOOK.pdfPath (the build fails if this is true and the file is missing),
   * GHL delivery workflow tested, source-verification publishing review approved by Allan (Addendum §6).
   */
  ebookLive: false,
  /** Discovery calendar verified and its URL set in DESTINATIONS.discoveryBooking. */
  bookingLive: false,
} as const;
