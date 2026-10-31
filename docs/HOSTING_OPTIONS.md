# Hosting options (recommendation only, nothing provisioned)

Required by Master Handoff v3 §2.7. No paid service has been set up, and nothing moves without Allan's approval. Check current plan limits and prices on each provider's own pricing page before deciding; they change often.

| Option                    | Cost profile                                                                       | Maintenance                                                                     | DNS control                                                 | GHL integration                                                                      | Fits this repo                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Netlify** (recommended) | Free tier covers a small business site; pay only if traffic or function use grows  | Push to GitHub = deploy; deploy previews per branch; one-click rollback         | Keep DNS at Namecheap; point only `@` and `www`             | The two small functions (inquiry, ebook) run here and keep the GHL token server-side | ✅ Works as-is (`netlify.toml`, functions, Blobs). You already use Netlify for the portfolio |
| Cloudflare Pages          | Generous free tier                                                                 | Similar Git-based deploys                                                       | Easiest if DNS moves to Cloudflare; partial setups possible | Functions need porting to Workers syntax                                             | ⚠️ Small porting job for the two functions                                                   |
| Vercel                    | Free hobby tier is for **non-commercial** use; a business site needs the paid plan | Similar                                                                         | Keep DNS at registrar                                       | Functions need small changes                                                         | ⚠️ Licence/cost mismatch for a business                                                      |
| GHL-hosted website/funnel | Included in your GHL plan                                                          | Edited in GHL's builder, not code; this Astro build can't be hosted there as-is | GHL handles the domain                                      | Native                                                                               | ❌ Would mean rebuilding the site in GHL                                                     |

**Recommendation: Netlify.**

- It works with this codebase unchanged, including the server-side GHL connection and the honest form states.
- Branch previews make approvals safe.
- Rollback is one click.
- Only two DNS records change at cutover, and the shop, payroll, kits and international subdomains are untouched.

Cutover and rollback steps are in `docs/DEPLOYMENT.md`.
