/**
 * PromdiPreneur SME Growth System packages (Homepage v2 handoff §3.9, approved by Allan 2026-11-01).
 * This file is the ONLY place prices may live in source: scripts/check-brand.mjs fails the build if a ₱ amount
 * appears anywhere else, or anywhere in the built site outside <section id="pricing">.
 * Change prices here only, and only with Allan's approval.
 */
export interface Package {
  id: 'start' | 'sell' | 'book' | 'grow' | 'pro';
  name: string;
  headline: string;
  bestFor: string;
  monthly: string;
  setup: string;
  /** "from" pricing (PRO) */
  from?: boolean;
  popular?: boolean;
  dark?: boolean;
}

export const PACKAGES: Package[] = [
  {
    id: 'start',
    name: 'START',
    headline: 'Stop losing leads sa magulong inquiries',
    bestFor: 'For businesses buried in DMs, calls and chats.',
    monthly: '₱2,800',
    setup: '₱7,500',
  },
  {
    id: 'sell',
    name: 'SELL',
    headline: 'Quotations that turn into paid orders',
    bestFor: 'For suppliers, dealers and B2B sellers.',
    monthly: '₱3,500',
    setup: '₱15,000',
  },
  {
    id: 'book',
    name: 'BOOK',
    headline: 'Wala nang no-show. Auto reminders + deposits.',
    bestFor: 'For clinics, salons, cleaning and services.',
    monthly: '₱3,500',
    setup: '₱15,000',
  },
  {
    id: 'grow',
    name: 'GROW',
    headline: 'Leads, sales, bookings and payments — isang sistema',
    bestFor: 'For growing teams tired of scattered apps and sheets.',
    monthly: '₱8,000',
    setup: '₱25,000',
    popular: true,
  },
  {
    id: 'pro',
    name: 'PRO / AI GROWTH',
    headline: '24/7 AI that answers, books and follows up',
    bestFor: 'For multi-branch, e-commerce and high-volume operators.',
    monthly: '₱10,000',
    setup: '₱35,000',
    from: true,
    dark: true,
  },
];

/**
 * Cost-perspective box (§3.9). Per rep: Metro Manila minimum wage ₱755/day × 26 days = ₱19,630 basic
 * + SSS ER ~₱1,980 + PhilHealth ER ~₱491 + Pag-IBIG ₱200 + 13th month ~₱1,636 ≈ ₱23,937 → shown as ~₱24,000.
 * Allan chose to keep the Metro Manila figure and say so in the headline (decision 4A, 2026-11-01).
 * Re-check against the current NCR wage order and contribution tables before launch.
 */
export const COST_BARS = [
  { label: '4 reps (salary + benefits)', amount: '~₱96,000/mo', pct: 100, ours: false },
  { label: '2 reps (salary + benefits)', amount: '~₱48,000/mo', pct: 50, ours: false },
  { label: 'PRO / AI GROWTH', amount: 'from ₱10,000/mo', pct: 10.4, ours: true },
  { label: 'GROW', amount: '₱8,000/mo', pct: 8.3, ours: true },
];

export const COST_FOOTNOTE =
  'Estimate per rep: Metro Manila minimum wage of ₱755/day (Sept 2026) × 26 days, plus employer SSS, PhilHealth, Pag-IBIG and 13th-month pay ≈ ₱24,000/mo. Experienced reps usually earn more. Setup fee and usage charges are separate.';
