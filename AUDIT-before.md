# Blooms by Marra — Impeccable technical audit

Date: 2026-11-04. Scope: `dist/index.html`, `dist/styles.css`, `dist/app.js`, `dist/catalog.js`, existing shopping tests, and persisted storefront design guidance. Audit only; application files were not changed.

## Implementation integrity verdict

**Pass for product specificity; request-flow resilience needs work.** The flower-specific catalog, occasion filters, size selection, gift message, PHP estimates, and explicit Messenger confirmation flow form a coherent product. Sample products are disclosed consistently, and the implementation does not invent ratings, accept payments, or claim that an inquiry is a confirmed order. There are verified failure paths around focus, image recovery, asynchronous copying, and cross-tab state.

The Impeccable detector did not run: its launcher could not download engine 0.1.18. There are no detector findings or detector false positives to report. All findings below come from code inspection, calculated token contrast, or the explicitly described JavaScript probes.

## Audit health score

These are **provisional source-level scores**, not a rendered-accessibility certification or a measured performance score.

| Dimension | Score | Key finding |
| --- | --- | --- |
| Accessibility | 2/4 | Focus restoration skips disabled quantity controls; modal status region is outside the active dialog. |
| Performance | 3/4 | Lean, dependency-free application; hero image lacks responsive candidates. |
| Theming | 3/4 | Main semantic colors work well; several residual colors bypass tokens. |
| Responsive design | 3/4 | Mobile/tablet breakpoints and wrapping exist; small-screen icon targets drop below the chosen 44px floor. Rendered reflow remains unverified. |
| Implementation integrity | 2/4 | Image-failure race, asynchronous copy race, and cross-tab clearing leave gaps in the intended behavior. |
| **Total** | **13/20** | **Acceptable — significant work needed before release.** |

**Issue count: 8 — P0: 0 verified; P1: 2; P2: 5; P3: 1.** Prioritize keyboard focus, modal feedback, and the copy-request race.

## Evidence and limits

- `npm run check`: passes both JavaScript syntax checks.
- `npm test`: all five existing tests pass. They cover persisted bag sanitization, size/quantity totals, delivery/pickup summaries, and the local date helper. They do not exercise browser DOM behavior.
- Additional in-process probes executed the actual application JavaScript with minimal DOM/event doubles. They reproduced the missed fallback for an already-failed image, failure to clear the bag for a null-key storage event, and a `TypeError` if the summary DOM is replaced while clipboard copying is pending. These are JavaScript/control-flow probes, not browser or assistive-technology tests.
- Base foreground/background token pairs were calculated using sRGB relative luminance: ink on paper **11.15:1**, muted on paper **5.68:1**, muted on blush **4.90:1**, white on ink **11.83:1**, and error red on white **7.28:1**. These exceed the 4.5:1 normal-text threshold for those exact opaque pairs. Photo overlays, composited backgrounds, focus-ring contrast, and native controls were not measured.
- Chromium launch failed with `Operation not permitted`; no screenshots, viewport emulation, synthesized touch, keyboard run, screen-reader run, zoom/reflow check, or Core Web Vitals measurement completed. No screenshot fixtures or visual goldens exist in the project.
- `PRODUCT.md` and `DESIGN.md` are absent. Existing intent was recovered from `PLAN.md` and `design-system/blooms-by-marra/`. Their absence is not itself a quality defect and did not trigger context-file creation.
- The storefront intentionally uses one light palette. An unrequested dark theme is not treated as a defect.

## Detailed findings

### 1. [P1] Quantity changes can remove keyboard focus at either limit

**Location:** `dist/app.js:36`, `dist/app.js:65–67`.

**Category:** Accessibility.

**Evidence:** Every quantity update calls `renderBag()`, replacing the focused button via `innerHTML`. Restoration then queries the same direction with `:not(:disabled)`. Decreasing from 2 to 1 disables the minus control; increasing from 19 to 20 disables the plus control. Both restoration queries have no matching control. The original focused node has already been removed, and no fallback is chosen. The cross-tab re-render at `dist/app.js:93` also replaces an active request form without moving focus to a surviving control.

**Impact:** Keyboard shoppers can lose their working position during routine bag updates. A concurrent edit in another tab can interrupt a partially completed request. Exact browser focus placement needs runtime confirmation, but the missing restoration paths are explicit in the source.

**Relevant standard:** WCAG 2.4.3 Focus Order; verify the resulting keyboard sequence in a browser.

**Recommendation:** Retain stable line-item DOM where possible. Otherwise restore to an enabled control in the same item, then a predictable dialog control. Define an explicit focus destination when a cross-tab update replaces the current step.

**Suggested command:** `$impeccable harden`.

### 2. [P1] Bag feedback lives outside the active modal

**Location:** `dist/index.html:47–48`; `dist/app.js:10`, `dist/app.js:69`, `dist/app.js:93`.

**Category:** Accessibility.

**Evidence:** Both dialogs use `showModal()`. The sole toast/status region is their sibling in the document, and remove/cross-tab feedback is sent there while the bag dialog is open. The rest of the document is inert during a native modal session; the toast is also outside the dialog's visual top layer. The changing subtotal and quantity are not independent live regions inside the bag.

**Impact:** Users may not receive the confirmation or reason for a bag update, especially assistive-technology users whose active context is the modal. An ordinary high `z-index` cannot elevate a document toast above the modal top layer.

**Relevant standard:** WCAG 4.1.3 Status Messages. Browser/screen-reader announcement behavior remains untested.

**Recommendation:** Provide a contextual `role="status"` region inside the active dialog. Announce a complete result such as “The Blush Edit removed. Two items remain.” Keep page-level feedback for operations performed outside dialogs.

**Suggested command:** `$impeccable harden`.

### 3. [P2] Editing the request while copying can produce an unhandled exception

**Location:** `dist/app.js:73–76`.

**Category:** Implementation integrity.

**Reproduction:** Start copying, then choose Edit request details before `navigator.clipboard.writeText()` settles. `renderRequest()` removes `#copy-help` and `#request-summary`. When copying resolves, the success handler dereferences the missing help element, enters `catch`, and the fallback dereferences the missing summary element. A delayed clipboard promise and replaced summary nodes reproduced `TypeError: Cannot read properties of null (reading 'focus')`.

**Impact:** Clipboard feedback can fail and produce an unhandled error while the visitor has already moved to a different step.

**Standard:** No conformance claim; asynchronous UI lifecycle robustness.

**Recommendation:** Capture the active step and nodes before awaiting, then check that the step still exists before changing it. Handle clipboard failure separately from DOM-update errors, and expose an in-progress copy state.

**Suggested command:** `$impeccable harden`.

### 4. [P2] The image fallback misses failures that happened before listener attachment

**Location:** `dist/app.js:22`, `dist/app.js:94`; static images in `dist/index.html:27`, `dist/index.html:40`.

**Category:** Implementation integrity.

**Evidence:** `attachImageFallbacks()` only attaches a future `error` listener. It does not check `img.complete && img.naturalWidth === 0`. A static photo can fail before the deferred module reaches initialization, particularly when an external font/module/network request delays execution. An already-failed image passed to the actual helper received no fallback in the probe.

**Impact:** A photograph can remain broken even though a bundled illustration is available. This weakens the recovery guarantee documented in the README.

**Standard:** No conformance claim; resilient media loading.

**Recommendation:** Use an idempotent fallback handler and call it immediately for already-completed, failed images as well as future errors. Preserve empty alternative text for decorative images rather than rewriting every failed image as meaningful content.

**Suggested command:** `$impeccable harden`.

### 5. [P2] Clearing storage in another tab leaves a stale bag

**Location:** `dist/app.js:93`.

**Category:** Implementation integrity.

**Evidence:** The listener handles only `event.key === storageKey`. A `localStorage.clear()` operation in another same-origin tab reports `key === null`. Dispatching that event with a populated in-memory bag left the bag populated in the probe. Single-key removal is already handled correctly.

**Impact:** Browser tabs can disagree about whether a bag exists. A later modification can save an old bag back into storage after it was cleared elsewhere.

**Standard:** No conformance claim; cross-tab state consistency.

**Recommendation:** Handle the null-key clear event by resetting the in-memory bag, updating the count, and handling any active dialog with the same deliberate focus policy as other cross-tab updates.

**Suggested command:** `$impeccable harden`.

### 6. [P2] Hero image always requests the 1400px variant

**Location:** `dist/index.html:27`.

**Category:** Performance.

**Evidence:** Product thumbnails supply `srcset` and `sizes`; the above-the-fold hero supplies only a URL with `w=1400`. It is reused across phone and desktop layouts. `fetchpriority="high"` is appropriate, but does not select a smaller image for a small or low-density display.

**Impact:** Visitors on smaller displays can download more image data than their rendered hero requires. Actual transfer size and LCP impact were not measured.

**Standard:** Responsive-image and loading-performance guidance, not a WCAG failure.

**Recommendation:** Add width candidates and accurate `sizes` for the half-width desktop/full-width mobile composition. Retain high priority on the hero; measure it under mobile network throttling afterward.

**Suggested command:** `$impeccable optimize`.

### 7. [P2] Narrow-screen icon buttons drop below the chosen touch-target floor

**Location:** `dist/styles.css:8`, `@media(max-width:370px) .icon-button`; `dist/index.html:22`.

**Category:** Responsive design.

**Evidence:** Base icon buttons are 44×44px. The narrow breakpoint changes their width to 40px. This applies to navigation/search icon controls and dialog close buttons. The last touch-target overrides restore product and quantity buttons, but do not restore `.icon-button` width.

**Impact:** The smallest supported screens get reduced tap areas for important controls, contrary to the persisted 44px interaction floor.

**Relevant standard:** A 44×44 CSS px target is the project's chosen quality floor and the WCAG 2.5.5 enhanced target-size benchmark. A 40×44px target is **not by itself** a violation of WCAG 2.5.8's 24px AA minimum.

**Recommendation:** Keep the hit areas at least 44×44px and recover space through header gaps or layout changes. Check 320px, 375px, landscape, and enlarged text in a browser.

**Suggested command:** `$impeccable adapt`.

### 8. [P3] Residual colors bypass semantic tokens

**Location:** `dist/styles.css:2` (`h1 em`, `.primary:hover`, `.occasion`, `.request-form` input borders).

**Category:** Theming.

**Evidence:** Functional and decorative values such as `#3f5843`, `#5b6d53`, `#a8b5a5`, and `#9da799` occur outside `:root`, alongside the otherwise established semantic palette.

**Impact:** A later palette change can leave hover, emphasis, and form boundaries behind. This is maintainability drift, not evidence that the current light palette fails contrast.

**Standard:** Project design-token consistency.

**Recommendation:** Add semantic tokens for primary hover, display emphasis, and strong form/section borders. Keep the intentional light palette; do not introduce an unrequested dark theme.

**Suggested command:** `$impeccable polish`.

## Systemic patterns

- Wholesale `innerHTML` replacement is simple for this small application, but focus and pending asynchronous actions are not consistently tied to the lifetime of the replaced UI.
- Success feedback is centralized at document level, while the primary shopping workflow runs inside a native modal.
- Error handling covers the common future event, but not already-settled images, cleared shared storage, or a clipboard operation completing after a step change.
- CSS overrides meet many individual touch/typography goals, but leave the narrowest icon-button rule behind.

## Positive findings to preserve

- Visible focus styles, skip navigation, meaningful landmarks, labeled controls, pressed filter states, native dialogs, and Escape handling are present.
- The measured opaque text token pairs are strong; no token-pair contrast failure was found in the checked combinations.
- Reduced motion removes nonessential animation while state changes still occur through text, selected styling, and native control updates. There is no animation-end dependency for correctness.
- Product/story media reserve space and below-the-fold photography is lazy-loaded. Product images already use responsive candidates.
- Static payload is small: approximately **57.7 KB** total across HTML, JS, CSS, and the local SVG, excluding external fonts/photos. Individually gzipped HTML/JS/CSS total approximately **17.9 KB**. These are local file measurements, not production HTTP transfer measurements.
- Bag data is validated, deduplicated, and quantity-bounded after loading. Personal request details are escaped before HTML interpolation and remain out of persistent bag storage.
- Clipboard fallback exists for unavailable automatic copying. Messenger is an explicit user action, and requests never claim to have been sent or paid.

## Recommended actions

1. **[P1/P2] `$impeccable harden blooms-by-marra`** — Fix focus restoration and modal status messages first, then request-copy lifecycle, already-failed image recovery, and cross-tab clearing. Add focused regression coverage around these actual failure paths.
2. **[P2] `$impeccable adapt blooms-by-marra`** — Preserve 44px hit areas on narrow screens and verify reflow, keyboard use, and touch in a working browser.
3. **[P2] `$impeccable optimize blooms-by-marra`** — Add responsive hero candidates and measure media loading on a mobile network profile.
4. **[P3] `$impeccable polish blooms-by-marra`** — Consolidate residual colors and verify the finished workflow visually after functional repairs.

You can ask me to run these one at a time, all at once, or in any order you prefer. Re-run `$impeccable audit` after fixes to compare the score and close the remaining browser-verification gaps.
