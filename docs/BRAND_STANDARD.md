# PromdiPreneur Brand Standard

Approved in Master Handoff V2.0 (30 Oct 2026). It applies to every customer-facing surface: website copy, meta tags, alt text, structured data, emails, flyers, the Facebook page and the international portfolio. If this file and older copy disagree, this file wins.

## Names

| Use                 | Exactly                                                | Notes                                                                                                                                                          |
| ------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand               | **PromdiPreneur**                                      | Capital P twice. No suffix.                                                                                                                                    |
| Role / positioning  | **Business Systems & Automation Implementer**          | Put it next to the logo, in About, in the footer and in metadata. It does not need to appear in every section.                                                 |
| Tagline             | **FROM DISKARTE TO SYSTEMS.**                          | Uppercase with a period as a lockup; "From diskarte to systems." in running text.                                                                              |
| Operating principle | **BUSINESS FIRST → SYSTEMS SECOND → TECHNOLOGY THIRD** |                                                                                                                                                                |
| Service family      | **PromdiPreneur Systems**                              | Umbrella for consulting, implementation and support. Use it as an offer label ("Explore PromdiPreneur Systems"). The main navigation label stays **Services**. |
| Journey phases      | **Review → Build → Improve**                           | These are explanatory labels. They are not packages, have no prices and set no fixed deliverables.                                                             |
| Primary CTA         | **Ask Us About Your Business**                         | A free message with no pressure. Short form: "Ask a Question".                                                                                                 |
| Secondary CTA       | **Explore Business Tools**                             | Leads to the digital shop and the product funnels.                                                                                                             |

## Do not use in new customer-facing material

- BASA, BASA Consultancy, BASA Packages, BASA 30, BASA 90, BASA Care
- Business Automation Solutions Architect / Business Automation Systems Architect
- "Promdipreneur" with a lowercase second p, in new copy

Legacy invoices, signed agreements, existing product names and CRM field/API identifiers keep their current names. Do not break a link, form, checkout, pixel or automation to make a cosmetic rename.

## Voice

- Talk about the reader's business, not our technology stack. Lead with their problem: missed inquiries, slow follow-up, manual admin, scattered tools, or everything depending on the owner.
- Use practical, plain English with Filipino context. Use "diskarte" in the tagline. Avoid heavy Tagalog.
- Make no exaggerated AI claims. Do not invent testimonials, client counts, ROI or certifications. Describe project status accurately: _built_, _prototyped_, _supported_ or _exploring_.
- Never promise a reply time we cannot keep. Do not promise a "free audit". The free offer is a question and a few practical suggestions.
- Keep prices off the hub. Prices live on the shop and product pages.

## Visual

| Token        | Hex       | Use                                                                                                           |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------- |
| Deep forest  | `#004C25` | Headings, primary buttons, dark sections                                                                      |
| Action green | `#18B957` | Large shapes, dots, accents on forest. **Never** use it for small text on light backgrounds (2.6:1 contrast). |
| Text green   | `#0B7339` | Green text and links on light backgrounds (5.6:1)                                                             |
| Earthy brown | `#754000` | Eyebrows, tagline                                                                                             |
| Off-white    | `#F7F7F3` | Page background                                                                                               |
| White        | `#FFFFFF` | Cards, alternate sections                                                                                     |
| Ink          | `#13241B` | Body text                                                                                                     |

- **Fonts:** Montserrat for headings and UI, Inter for body text. Both are self-hosted under the SIL OFL.
- **Logo:** use the salakot + lightbulb lockup (`public/images/brand/promdipreneur-logo-*.webp`) at its native 480×214 ratio with `object-fit: contain`. Do not stretch, recolour or add effects. Use the mark (`mark-*.webp`) where space is tight.
- **Shape:** corners 10–18px, restrained shadows, no autoplay and no gimmicky motion. Respect `prefers-reduced-motion`.

## Guardrail

`npm run check:brand` fails if a retired term, a ₱ price, AstroWind demo content or a fake ebook download appears in `src/` or the built site.
