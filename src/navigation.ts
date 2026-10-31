import { getPermalink } from './utils/permalinks';
import { CTA } from './data/brand';

// v3 §3 primary navigation. Contact, Privacy and Terms live in the footer.
export const headerData = {
  links: [
    { text: 'Home', href: getPermalink('/') },
    { text: 'What We Do', href: getPermalink('/services') },
    { text: 'Our Work', href: getPermalink('/work') },
    { text: 'Digital Store', href: getPermalink('/products') },
    {
      text: 'Resources',
      links: [
        { text: 'Free Ebook: Business Opening Checklist PH', href: getPermalink('/resources/free-ebook') },
        { text: 'All Resources', href: getPermalink('/resources') },
      ],
    },
    { text: 'About', href: getPermalink('/about') },
  ],
  cta: { text: CTA.primary, short: CTA.primaryShort, href: getPermalink('/discovery') },
};
