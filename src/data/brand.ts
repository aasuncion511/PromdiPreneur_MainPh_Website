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
  primary: 'Ask Us About Your Business',
  primaryShort: 'Ask a Question',
  secondary: 'Explore Business Tools',
  systems: 'Explore PromdiPreneur Systems',
  guide: 'Get the Free Business Guide',
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
    url: 'https://shop.promdipreneur.com/',
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
    // m.me/Promdipreneur is preferred once Allan confirms it opens the page chat (docs/PENDING.md).
    url: 'https://www.facebook.com/Promdipreneur',
    label: 'Chat with us on Facebook',
    event: 'contact_messenger_click',
    kind: 'social',
    forwardUtm: false,
    status: 'unverified',
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
    // PENDING: the PH discovery-call calendar is not supplied. The portfolio's booking widget is for international
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
  /** Free guide: final PDF, cover artwork and GHL delivery workflow approved. Keep false until all three exist. */
  ebookLive: false,
  /** Discovery booking calendar approved and its URL set in DESTINATIONS.discoveryBooking. */
  bookingLive: false,
} as const;
