/**
 * Product registry (handoff v1.1 §21) and verified work. Data-driven: adding a product is a new record here,
 * not a page redesign. Facts checked against the live funnels and portfolio.promdipreneur.com on 30 Oct 2026.
 * No prices: pricing lives on the product/shop pages and changes there.
 */
import type { ImageMetadata } from 'astro';
import type { DestinationId } from './brand';

import shopImg from '~/assets/images/hub/tool-shop-800.webp';
import kitsImg from '~/assets/images/hub/tool-kits-800.webp';
import payrollImg from '~/assets/images/hub/tool-payroll-800.webp';
import freshImg from '~/assets/images/hub/work-fresh-800.webp';
import payrollSheetImg from '~/assets/images/hub/work-payroll-800.webp';

export type ProductStatus = 'live' | 'in-development';
export type ProductCategory = 'Apps & Business Systems' | 'Business-in-a-Box' | 'Online Store';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  forWho: string;
  summary: string;
  includes: string[];
  /** null = render the labelled illustration placeholder (no approved screenshot). */
  image: ImageMetadata | null;
  imageAlt: string;
  cta: { label: string; destination: DestinationId } | null;
  secondaryCta?: { label: string; destination: DestinationId };
  featured: boolean;
  order: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'payroll',
    name: 'PromdiPreneur Payroll',
    category: 'Apps & Business Systems',
    status: 'live',
    forWho: 'Philippine SMEs running payroll by hand every cutoff',
    summary: 'Make payroll computation, payslips and records easier to manage, in a Google Sheets workbook.',
    includes: [
      'SSS, PhilHealth and Pag-IBIG shares and withholding tax',
      'Attendance, overtime and holiday premiums',
      'PDF payslips emailed from your own Google account',
      'Locked history for finalized cutoffs',
    ],
    image: payrollImg,
    imageAlt: 'PromdiPreneur Payroll guided demo showing the setup steps and employee sheet (sample data)',
    cta: { label: 'See Payroll Solution', destination: 'payroll' },
    secondaryCta: { label: 'Try the live demo', destination: 'payrollDemo' },
    featured: true,
    order: 1,
  },
  {
    id: 'cleaning-kits',
    name: 'Cleaning Business Kits',
    category: 'Business-in-a-Box',
    status: 'live',
    forWho: 'Owners of cleaning service businesses',
    summary: 'A more organized way to manage service operations, forms and pricing.',
    includes: [
      'Operations manual and editable forms, from inquiry to sign-off',
      'Service offer and pricing workbook',
      'Built from the systems Fresh Start Cleaning Services uses on real jobs',
    ],
    image: kitsImg,
    imageAlt: 'Sample pages from the cleaning business forms kit',
    cta: { label: 'Explore Cleaning Kits', destination: 'kits' },
    featured: true,
    order: 2,
  },
  {
    id: 'digital-shop',
    name: 'PromdiPreneur Digital Store',
    category: 'Online Store',
    status: 'live',
    forWho: 'Anyone who wants a ready-to-use tool today',
    summary: 'Browse ready-to-use forms, manuals, business kits and digital tools in one place.',
    includes: ['One checkout for everything', 'Files emailed after payment', 'Secure checkout'],
    image: shopImg,
    imageAlt: 'Covers of PromdiPreneur digital products in the online shop',
    cta: { label: 'Browse the Digital Store', destination: 'shop' },
    featured: true,
    order: 3,
  },
  {
    id: 'car-rental-os',
    name: 'Car Rental OS',
    category: 'Apps & Business Systems',
    status: 'in-development',
    forWho: 'Philippine car rental operators',
    summary:
      'A booking website and fleet operations dashboard for car rental businesses. In development with sample data; no operator is live on it yet.',
    includes: ['Online reservations with a short hold', 'Fleet release and return records', 'Owner dashboard'],
    image: null,
    imageAlt: '',
    cta: null,
    featured: false,
    order: 4,
  },
];

export const STATUS_LABEL: Record<ProductStatus, string> = {
  live: 'Available now',
  'in-development': 'In development',
};

export type WorkStatus =
  | 'Built'
  | 'Designed and supported'
  | 'Design built · preview live'
  | 'Architecture designed · to be built'
  | 'In development'
  | 'Working concept';

export interface WorkItem {
  id: string;
  title: string;
  status: WorkStatus;
  context: string;
  problem: string;
  approach: string;
  built: string;
  image: ImageMetadata | null;
  imageAlt: string;
  caseStudyUrl: string;
  featured: boolean;
}

export const WORK: WorkItem[] = [
  {
    id: 'fresh-start',
    title: 'Fresh Start Cleaning Services',
    status: 'Built',
    context: 'Our own service business, Cagayan de Oro',
    problem: 'Inquiries, quotes, crew schedules and follow-ups ran on memory and chat threads.',
    approach: 'Mapped the job from inquiry to sign-off, then wrote the process down.',
    built: 'Service workflows and business documentation the team uses on real jobs.',
    image: freshImg,
    imageAlt: 'Fresh Start Cleaning Services website hero',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/fresh-start',
    featured: true,
  },
  {
    id: 'payroll',
    title: 'PromdiPreneur Payroll',
    status: 'Built',
    context: 'Our own software product',
    problem: 'Payroll for Philippine SMEs is repetitive, error-prone and done from scratch every cutoff.',
    approach: 'Turned each cutoff into the same steps: prepare, validate, finalize.',
    built: 'A Google Sheets and Apps Script payroll workbook with payslips and records.',
    image: payrollSheetImg,
    imageAlt: 'Employee sheet in the PromdiPreneur Payroll workbook, sample data',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/payroll',
    featured: true,
  },
  {
    id: 'minbizcon',
    title: 'MinBizCon 2026 QR Check-in',
    status: 'Designed and supported',
    context: '35th Mindanao Business Conference, Cagayan de Oro',
    problem: 'A three-day business conference needed fast registration and check-in at the door.',
    approach: 'One attendee record, one unique QR code, one scan at the desk.',
    // v3 says '800+ participants'; the verified source says 'about 800 expected'. Use the verified wording (docs/PENDING.md).
    built:
      'A QR registration and three-day check-in workflow on Google tools, planned for about 800 expected participants.',
    image: null,
    imageAlt: '',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/qr-checkin',
    featured: true,
  },
  {
    id: 'socri-website',
    title: 'Socri Private Resort: Website',
    status: 'Design built · preview live',
    context: 'Exclusive-use private resort, Iponan, Cagayan de Oro',
    problem: 'Guests needed one clear place to see packages, the venue and available dates.',
    approach: 'A one-page site that answers the questions guests ask in chat before they book.',
    built: 'Packages, a real photo tour and a date-check request form. Preview live; not yet launched.',
    image: null,
    imageAlt: '',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/socri',
    featured: false,
  },
  {
    id: 'socri-booking',
    title: 'Socri Private Resort: Booking System',
    status: 'Architecture designed · to be built',
    context: 'Booking automation behind the resort website',
    problem: 'Reservations, payments and calendar holds were confirmed by hand in chat.',
    approach: 'Design the inquiry-to-confirmed-booking flow before building anything.',
    built: 'Architecture designed: CRM, verified payments, automatic calendar booking, SMS and email. Not built yet.',
    image: null,
    imageAlt: '',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/socri-booking',
    featured: false,
  },
  {
    id: 'digital-store',
    title: 'PromdiPreneur Digital Store',
    status: 'Built',
    context: 'Our own online store',
    problem: 'Digital products and a software licence need very different steps after payment.',
    approach: 'One store, with the right next step for each kind of product.',
    built: 'A store with secure checkout: files emailed for kits, a setup form for payroll licences.',
    image: shopImg,
    imageAlt: 'Product covers in the PromdiPreneur Digital Store',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/digital-store',
    featured: false,
  },
  {
    id: 'cleaning-kits',
    title: 'Cleaning Business Kits',
    status: 'Built',
    context: 'Our own digital product',
    problem: 'Cleaning business owners start every job and every quote from a blank page.',
    approach: 'Packaged real operating documents from Fresh Start into editable kits.',
    built: 'A product funnel, kits and delivery after payment.',
    image: kitsImg,
    imageAlt: 'Sample pages from the cleaning business forms kit',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/cleaning-kits',
    featured: false,
  },
  {
    id: 'car-rental-os',
    title: 'Car Rental OS',
    status: 'In development',
    context: 'Booking website and fleet dashboard for car rental operators',
    problem: 'Reservations, holds and vehicle releases are tracked across chats and notebooks.',
    approach: 'Design the booking and release flow first, then the dashboard around it.',
    built: 'Working with sample data. No paying operator is live yet.',
    image: null,
    imageAlt: '',
    caseStudyUrl: 'https://portfolio.promdipreneur.com/work/car-rental-os',
    featured: false,
  },
];
