import { getPermalink } from './utils/permalinks';
import { CTA } from './data/brand';

interface NavLink {
  text: string;
  href?: string;
  links?: { text: string; href: string }[];
}

// Primary navigation. Contact, Privacy and Terms live in the footer.
export const headerData = {
  // Homepage v2 §3.1: 4 links + 1 CTA, site-wide (Allan, 2026-11-01, option 2A). About and the ebook stay
  // reachable from the footer and the homepage DIY strip.
  links: <NavLink[]>[
    { text: 'Solutions', href: `${getPermalink('/')}#solutions` },
    { text: 'Results', href: `${getPermalink('/')}#results` },
    { text: 'Pricing', href: `${getPermalink('/')}#pricing` },
    { text: 'Store', href: `${getPermalink('/')}#store` },
  ],
  cta: { text: CTA.primary, short: CTA.primaryShort },
};
