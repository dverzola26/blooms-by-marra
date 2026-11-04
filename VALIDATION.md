# Validation and publication status

- Sequential passes complete: harden, adapt, optimize, polish.
- `npm run check`: passed.
- `npm test`: **19 passed**, including actual-handler regressions using DOM/event doubles. No browser E2E claim.
- Static HTML/CSS checks passed: IDs, internal targets, local assets, responsive hero, modal status regions, token confinement, and removal of the 40px icon override.
- Source audit: **16/20**, up from 13/20. All eight original findings fixed at source level. See [AUDIT.md](AUDIT.md); original in [AUDIT-before.md](AUDIT-before.md).
- Browser QA unavailable: Chromium fails with `Operation not permitted`; local sockets are restricted. Geometry, touch, native keyboard behavior, screen readers, photo overlays, and performance require browser checks.
- Detector unavailable: engine 0.1.18 could not be downloaded. No clean scan claimed.
- External Unsplash/Google Fonts responses unverified. A bundled floral fallback and system font fallback are present.
- Publication has not succeeded. Site identity is preserved in `.openai/hosting.json`; no live URL is claimed. The retry with fresh repository credentials also failed to resolve `git.chatgpt-team.site`; no source version was saved or deployed.

## Local preview

Run `npm start` in your own terminal from this directory, then open http://localhost:4173. No dependencies or build needed. Node 24 is used for check/test commands.

Catalog products, prices, photography, and sizes remain samples. Messenger opens on explicit visitor action; nothing is sent automatically and no payment is collected.
