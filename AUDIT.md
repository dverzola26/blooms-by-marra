# Blooms by Marra — follow-up technical audit

Date: 2026-11-04. Completed in order: **harden → adapt → optimize → polish → source re-audit**. The original evidence remains in [AUDIT-before.md](AUDIT-before.md).

## Verdict and score

The product-specific system remains coherent. All eight original findings have corresponding source fixes. Regression coverage verifies the repaired JavaScript paths. Browser, assistive-technology, rendered-performance, and detector verification remain outstanding; this is not a WCAG certification or a measured performance result.

| Dimension | Before | After | Evidence and limits |
| --- | --- | --- | --- |
| Accessibility | 2/4 | 3/4 | Enabled focus destinations after bag updates; modal status regions; semantic delivery requirement. Native keyboard and AT behavior still need checking. |
| Performance | 3/4 | 3/4 | Responsive hero/story images and fewer font weights. Network timings and Core Web Vitals unmeasured. |
| Theming | 3/4 | 4/4 | CSS colors centralized in tokens; explicit light control scheme; selection/caret/scrollbar states. Scope is the single intended light palette. |
| Responsive design | 3/4 | 3/4 | 44px icon targets, fluid narrow headings, 16px search input, shrinkable fields, sticky bag header. Rendered geometry remains unverified. |
| Implementation integrity | 2/4 | 3/4 | Races and shared-state recovery covered by regressions; sample/Messenger flow preserved. Detector unavailable. |
| **Total** | **13/20** | **16/20** | **Good — provisional source-level result.** |

No new P0/P1 defect was verified in this pass. All original findings are resolved at source level; browser-dependent outcomes still need confirmation.

## Original finding disposition

| # | Original severity | Finding | Result |
| --- | --- | --- | --- |
| 1 | P1 | Focus lost at quantity limits/cross-tab replacement | `focusBagLine` and `focusInBag` choose an enabled destination after re-render. Cross-tab changes focus review or the empty-state action and retain entered request details. Limit/removal/storage paths tested. |
| 2 | P1 | Feedback outside active modal | Atomic status regions now live inside each dialog. Feedback routes to the active surface. Product additions close details before announcing on the page. Routing tested; AT verification pending. |
| 3 | P2 | Copy completion touches replaced DOM | View version and node connectivity guard pending operations. Busy state prevents repeat copying. Success, rejection, edit/close races, retry, and duplicate clicks tested. |
| 4 | P2 | Already-failed images miss fallback | Completed failures checked immediately; future errors handled once; `srcset` removed; decorative empty alternative text preserved. Both timing paths tested. |
| 5 | P2 | Cross-tab clear leaves stale bag | Null-key events clear the bag. Unrelated keys/storage areas ignored. Clear and replacement events tested with deliberate focus recovery. |
| 6 | P2 | Fixed 1400px hero request | 480/800/1200/1600px candidates and mobile/desktop `sizes`; high priority retained. Story image also responsive. Markup verified. |
| 7 | P2 | Narrow icons below 44px | 40px override removed; base 44×44px icon controls retained. Static CSS verified; device/reflow checks pending. |
| 8 | P3 | Colors outside tokens | Hover/emphasis/media/boundary/scrim/shadow values centralized. Form boundaries strengthened. Static scan finds no CSS color literals outside root tokens. |

## Sequential refinements

1. **Harden:** repaired focus, modal feedback, copy lifecycle, image recovery, and cross-tab state. Added a no-JavaScript Messenger route and initial semantic delivery-area requirement.
2. **Adapt:** maintained 44px targets; improved narrow headings/wrapping, 16px search/form input text, shrinkable fields, and a sticky bag header/close control.
3. **Optimize:** supplied responsive primary media and image-host preconnection; reduced font requests to used Inter 400/500 and Playfair Display regular/italic 400 faces. Below-fold media remains lazy-loaded; no dependencies added.
4. **Polish:** consolidated tokens, styled browser selection/caret/scrollbars, added forced-color control boundaries, preserved meaningful progress beneath the dialog title, removed ornamental pre-heading labels, and replaced nonexistent product fragment links with detail buttons. CSS formatted for review.

## Verification

- `npm run check`: passes.
- `npm test`: **19 passing tests**. Fourteen DOM/event-double cases execute the actual application handlers; five check shopping data and summaries. These are not browser E2E tests.
- Static HTML: unique IDs, existing section targets/local assets, responsive hero candidates, and modal status elements verified.
- Static CSS: literal colors confined to root tokens; no 40px icon override.
- Local payload: approximately **67.1 KB**, versus **57.7 KB** before. Individually gzipped assets total approximately **19.4 KB**, versus **18.2 KB** before. Resilience code/readable formatting increase local payload; no overall byte-reduction claim is made. External media/font transfer bytes and timings are unmeasured.
- Chromium still fails with `Operation not permitted`. No viewport screenshots, keyboard walk-through, synthesized touch, physical-device test, zoom, screen-reader check, or rendered contrast verification completed.
- Impeccable's detector still cannot download engine 0.1.18. No successful detector run or clean-scan claim.

## Remaining verification

In a working browser, check 320/375/768/1024/1440px layouts, mobile landscape, 200% text scaling, keyboard bag edits, screen-reader announcements, blocked/slow images, clipboard denial, and responsive source selection. Then measure LCP/INP/CLS and run the detector. The catalog remains illustrative and needs owner-approved products/policies before commercial launch.
