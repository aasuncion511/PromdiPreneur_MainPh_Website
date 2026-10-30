/**
 * Service content. Solution names are the five canonical solutions (handoff v1.1 §6); the family name and
 * Review → Build → Improve phases follow V2.0 §0A. No prices or package durations (V2.0: price-free hub).
 */

export const PROBLEMS = [
  {
    icon: 'tabler:messages',
    title: 'Customer messages get buried.',
    body: 'Inquiries come from different places, and some never get a reply.',
  },
  {
    icon: 'tabler:user-exclamation',
    title: 'Everything depends on you.',
    body: 'Your team keeps asking because the process lives in your head.',
  },
  {
    icon: 'tabler:repeat',
    title: 'Too much time goes to repeat work.',
    body: 'Reports, documents and follow-ups take longer than they should.',
  },
  {
    icon: 'tabler:puzzle',
    title: 'Your tools don’t work together.',
    body: 'You have spreadsheets and apps, but no clear flow from inquiry to sale.',
  },
];

export const STEPS = [
  {
    title: 'Understand the problem',
    body: 'A practical conversation or diagnostic to see where time, leads or sales are being lost.',
  },
  {
    title: 'Design a clearer way to work',
    body: 'Map the customer journey, responsibilities and simple steps your team can follow.',
  },
  {
    title: 'Build the right system',
    body: 'Templates, CRM, forms, websites, automations, training or an ongoing improvement plan—depending on what fits.',
  },
];

export const SOLUTIONS = [
  {
    id: 'lead-organization',
    name: 'Lead Organization',
    short: 'Every inquiry in one place, with a clear owner and next step.',
    signs: [
      'Inquiries scattered across Messenger, Viber, calls and notebooks',
      'No one knows which customers are still waiting',
    ],
    helps: [
      'One inbox and customer record',
      'Simple stages so nothing is forgotten',
      'Owner visibility without asking around',
    ],
  },
  {
    id: 'lead-to-sale',
    name: 'Lead-to-Sale',
    short: 'Quotes that get followed up until there is a decision.',
    signs: ['Quotations sent with no reminder system', 'Payments checked by hand before work can start'],
    helps: [
      'Quote and follow-up steps your team can repeat',
      'A clear won / lost record',
      'Payment confirmation before the next step',
    ],
  },
  {
    id: 'lead-to-booking',
    name: 'Lead-to-Booking',
    short: 'From inquiry to confirmed booking, with fewer no-shows.',
    signs: ['Back-and-forth to agree a schedule', 'Clients forget, staff forget to remind'],
    helps: [
      'Booking and confirmation flow',
      'Reminders that go out on time',
      'Deposits or payment before the slot is held',
    ],
  },
  {
    id: 'integrated-customer-journey',
    name: 'Integrated Customer Journey',
    short: 'Sales, service and repeat business connected end to end.',
    signs: ['Handoffs between sales and operations break', 'No follow-up after the job, so no repeat business'],
    helps: ['Inquiry-to-service handoffs', 'After-service follow-up and reviews', 'Repeat-customer reminders'],
  },
  {
    id: 'ai-growth',
    name: 'AI & Advanced Automation',
    short: 'Carefully scoped AI where the process is already solid.',
    signs: ['After-hours inquiries with no one to answer', 'Repetitive admin that follows clear rules'],
    helps: [
      'AI-assisted replies and admin with human handoff',
      'Integrations between your tools',
      'Available depending on scope, usage and business readiness',
    ],
  },
];

export const JOURNEY = ['Attract', 'Capture', 'Convert', 'Serve', 'Retain', 'Intelligence'];

export const PHASES = [
  {
    phase: 'Review',
    icon: 'tabler:search',
    items: ['Business Systems Review', 'Process & Automation Blueprint'],
    body: 'We look at how work actually moves today, where it leaks, and what to fix first.',
  },
  {
    phase: 'Build',
    icon: 'tabler:hammer',
    items: ['Website, CRM & Workflow Implementation'],
    body: 'We build the agreed system in tools that fit your business, then hand it over with simple instructions.',
  },
  {
    phase: 'Improve',
    icon: 'tabler:trending-up',
    items: ['Ongoing Systems Support'],
    body: 'We keep the system working and improve the next workflow on the list.',
  },
];

export const SERVICE_FAQS = [
  {
    title: 'How much does it cost?',
    description:
      'It depends on what your business needs, so we don’t publish fixed packages here. After we understand your situation, you get a written scope and price before anything starts. Your first question is free.',
  },
  {
    title: 'Do I need to buy new software?',
    description:
      'Not necessarily. We start with your process, then use what you already have where it fits. Sometimes a clear checklist or a Google Sheet is the right answer.',
  },
  {
    title: 'Do you only work with businesses in Cagayan de Oro?',
    description:
      'We are based in Cagayan de Oro and work with businesses across the Philippines. Most work can be done online.',
  },
  {
    title: 'What happens after I send a question?',
    description:
      'A real person reads it and replies personally when available, with a few practical suggestions or the next step. There is no obligation to buy anything.',
  },
];
