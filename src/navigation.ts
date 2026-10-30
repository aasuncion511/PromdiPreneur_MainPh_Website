import { getPermalink } from './utils/permalinks';
import { CTA, BRAND, DESTINATIONS } from './data/brand';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'Our Work', href: getPermalink('/our-work') },
    { text: 'Products', href: getPermalink('/products') },
    {
      text: 'Resources',
      links: [
        { text: 'Free Business Guide', href: getPermalink('/free-guide') },
        { text: 'All Resources', href: getPermalink('/resources') },
      ],
    },
    { text: 'About', href: getPermalink('/about') },
  ],
  actions: [
    { text: CTA.primary, href: getPermalink('/contact'), variant: 'primary' as const, 'data-placement': 'header' },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Explore',
      links: [
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Our Work', href: getPermalink('/our-work') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Business Tools',
      links: [
        { text: 'All Products', href: getPermalink('/products') },
        { text: 'Digital Shop', href: DESTINATIONS.shop.url!, 'data-dest': 'shop' },
        { text: 'Cleaning Business Kits', href: DESTINATIONS.kits.url!, 'data-dest': 'kits' },
        { text: 'PromdiPreneur Payroll', href: DESTINATIONS.payroll.url!, 'data-dest': 'payroll' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Free Business Guide', href: getPermalink('/free-guide') },
        { text: 'All Resources', href: getPermalink('/resources') },
        { text: 'International portfolio', href: DESTINATIONS.portfolio.url!, 'data-dest': 'portfolio' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms', href: getPermalink('/terms') },
  ],
  socialLinks: [
    {
      ariaLabel: 'PromdiPreneur on Facebook',
      icon: 'tabler:brand-facebook',
      href: DESTINATIONS.facebook.url!,
      'data-dest': 'facebook',
    },
    { ariaLabel: `Email ${BRAND.email}`, icon: 'tabler:mail', href: DESTINATIONS.email.url!, 'data-dest': 'email' },
  ],
  footNote: `© ${new Date().getFullYear()} ${BRAND.name} · ${BRAND.role} · ${BRAND.location}`,
};
