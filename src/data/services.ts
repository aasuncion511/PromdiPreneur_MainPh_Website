/**
 * Service content — Master Handoff v3 §4–§5. Capability groupings, NOT priced packages or contractual
 * entitlements. Plain language: a visitor never needs to know what GHL, n8n or an API is.
 */

/** v3 §4B: pain → consequence (the organized process + result live in SERVICE_GROUPS). */
export const PROBLEMS = [
  {
    icon: 'tabler:messages',
    title: 'Inquiries scattered everywhere',
    body: 'Facebook, Messenger, Viber, calls. Some customers never get a reply—and buy elsewhere.',
  },
  {
    icon: 'tabler:clock-exclamation',
    title: 'Follow-ups that slip',
    body: 'Quotes go out, then nothing. Warm leads go cold because nobody remembered to check in.',
  },
  {
    icon: 'tabler:repeat',
    title: 'Too much manual admin',
    body: 'Re-typing the same details, chasing records, building reports by hand every week.',
  },
  {
    icon: 'tabler:puzzle',
    title: 'Tools that don’t connect',
    body: 'Spreadsheets and apps everywhere, but no clear flow from inquiry to sale to service.',
  },
  {
    icon: 'tabler:user-exclamation',
    title: 'Everything depends on the owner',
    body: 'The process lives in your head, so the team keeps asking and you can’t step away.',
  },
  {
    icon: 'tabler:chart-dots',
    title: 'No clear view of sales',
    body: 'You can’t easily see what’s coming in, what’s stuck and what’s been lost.',
  },
];

/** v3 §4C: what we can implement — shown as one connected system, not separate gigs. */
export const CAPABILITIES = [
  { icon: 'tabler:world-www', name: 'Websites & Funnels', short: 'Be found and turn visitors into inquiries.' },
  {
    icon: 'tabler:address-book',
    name: 'CRM & Customer Follow-up',
    short: 'Every inquiry in one place, followed up on time.',
  },
  {
    icon: 'tabler:arrows-shuffle',
    name: 'Workflows & Automation',
    short: 'Repeat steps handled the same way, every time.',
  },
  {
    icon: 'tabler:report-analytics',
    name: 'Business Operations & Reporting',
    short: 'SOPs, records and reports the owner can trust.',
  },
  {
    icon: 'tabler:apps',
    name: 'Custom Business Systems',
    short: 'Built around your workflow: booking, payroll, rentals, events.',
  },
];

/** v3 §4D: signature operating sequence. Technology enters after the workflow is understood. */
export const SEQUENCE = [
  {
    title: 'Understand Your Business',
    body: 'We look at how inquiries, sales and daily work actually move today—and where they leak.',
  },
  {
    title: 'Organize the Process',
    body: 'Clear steps, owners and records your team can follow, before any tool is chosen.',
  },
  {
    title: 'Build the Right System',
    body: 'Websites, CRM, forms, automations or a custom tool—only what fits the process.',
  },
  {
    title: 'Launch, Train & Improve',
    body: 'We hand it over with simple instructions, train your team and keep improving it.',
  },
];

/** v3 §5: PromdiPreneur Systems capability groupings. problem → what we do → what changes → CTA. */
export const SERVICE_GROUPS = [
  {
    id: 'get-found',
    icon: 'tabler:world-www',
    name: 'Get Found & Capture Leads',
    problem: 'People find you on Facebook, ask a question, and the conversation gets lost.',
    whatWeDo:
      'A professional website or focused funnel page, simple inquiry forms, and every inquiry routed to one place.',
    changes: 'Customers can find you, understand what you offer and reach you easily—and you see every inquiry.',
    example: 'A cleaning company website where quote requests land in one inbox instead of five chat apps.',
  },
  {
    id: 'follow-up',
    icon: 'tabler:address-book',
    name: 'Follow Up & Close More',
    problem: 'Quotations go out, then nothing happens. Nobody knows which leads are still waiting.',
    whatWeDo: 'A simple CRM and sales pipeline, quotation follow-up steps and timely reminders.',
    changes: 'Fewer forgotten leads, a clear won/lost record, and a pipeline you can check in one look.',
    example: 'A service business that follows up every quote on day 1 and day 3 without the owner chasing it.',
  },
  {
    id: 'operations',
    icon: 'tabler:list-check',
    name: 'Run Operations Better',
    problem: 'The same admin is done by hand every week and the process lives in one person’s head.',
    whatWeDo: 'Process mapping, SOPs, recurring task checklists, records, reports and practical automation.',
    changes: 'Your team can follow the process without asking you, and you can see what’s happening.',
    example: 'Crew deployment, quality checks and job sign-off recorded the same way on every job.',
  },
  {
    id: 'custom-systems',
    icon: 'tabler:apps',
    name: 'Business Systems Built for Your Workflow',
    problem: 'Off-the-shelf tools don’t fit how your business actually runs.',
    whatWeDo: 'Systems built around your workflow: booking, payroll, rental operations, event check-in and more.',
    changes: 'A tool that matches your process, with documentation and training for your team.',
    example: 'PromdiPreneur Payroll and the MinBizCon QR check-in started this way.',
  },
];

export const SERVICE_FAQS = [
  {
    title: 'How much does it cost?',
    description:
      'It depends on what your business needs, so we don’t publish fixed packages here. A Discovery Session helps us understand your situation first; you get a written scope and price before anything starts.',
  },
  {
    title: 'Do I need to buy new software?',
    description:
      'Not necessarily. We organize the process first, then use what you already have where it fits. Sometimes a clear checklist or a Google Sheet is the right answer.',
  },
  {
    title: 'Do you use AI?',
    description:
      'When it’s practical—for example to draft replies or handle routine admin with a person checking. We don’t add AI to a process that isn’t organized yet.',
  },
  {
    title: 'Do you only work with businesses in Cagayan de Oro?',
    description:
      'We are based in Cagayan de Oro and work with businesses across the Philippines. Most work can be done online.',
  },
];
