# Blooms by Marra

A responsive botanical storefront concept. See [PLAN.md](PLAN.md) for the UX plan, content assumptions, and commercial launch checklist.

Run `npm start` and visit http://localhost:4173. No dependencies or build are needed. `dist/` is the deployable site. Use `npm run check` and `npm test` for code and shopping logic checks.

Features: occasion filters, search, sorting, product details and sizes, persistent bag, quantity controls, request validation, editable request details, clipboard fallback, Messenger handoff, native dialogs, and reduced-motion support. Refinements add deliberate focus restoration, contextual modal status messages, safe interrupted copying, cross-tab clearing, responsive hero/story images, and 44px icon targets. See [AUDIT.md](AUDIT.md) and [VALIDATION.md](VALIDATION.md) for evidence and remaining browser checks. Check/test commands use Node 24.

No payments are collected, no messages are sent automatically, and no order is confirmed here. The six bouquets, photography, sizes, and prices are illustrative. The customer must paste and send the request in Messenger; the florist supplies the actual quote. Only the non-personal shopping bag is saved in localStorage. Personal request fields remain in page memory.

Fonts are loaded from Google Fonts; illustrative stock photos from Unsplash. Product imagery gracefully falls back to a local botanical illustration when unavailable. Replace sample catalog data in `dist/catalog.js` with an approved catalog before commercial launch.

## GitHub and Vercel

Import the GitHub repository into Vercel with the repository root as Root Directory. `vercel.json` selects the static `dist/` output, skips dependency installation, and runs `npm run build` (JavaScript syntax checks). No environment variables are required. Personal checkout details are never submitted to a backend.

After Git integration is connected, updates to the production branch can deploy through Vercel. See [Vercel configuration documentation](https://vercel.com/docs/project-configuration/vercel-json).
