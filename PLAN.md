# Blooms by Marra storefront plan

## Goal and scope
Create a mobile-friendly bouquet shopping experience for Blooms by Marra. This is a concept storefront: the owner has approved a sample catalog and Messenger order requests. Prices and stock are illustrative; no payments or orders are automatically accepted.

## Customer journey
1. Discover the flower shop through an editorial landing page.
2. Browse six sample bouquets by occasion, search by name, and sort by price.
3. Inspect an arrangement and choose a size.
4. Add arrangements to a persistent shopping bag and adjust quantities.
5. Choose pickup or delivery, request a date, and add a gift message.
6. Review and copy the request, then open the business's Messenger page to send it. The florist confirms availability, delivery fees, final price, and payment separately.

## Implementation
Standalone HTML, CSS, and ES modules; no package installation or build is required. There is no existing application stack in this new directory. A local JSON-like product module is the catalog source. Store only product IDs, variants, and quantities in localStorage; personal order details remain in memory. Native dialogs provide keyboard focus containment and Escape-to-close. No third-party tracking.

## Brand direction
Use the UI/UX Pro Max organic botanical direction and Playfair Display/Inter typography recommendation. The page override refines the bright database palette to dark olive, cream, and petal pink, with warm photography and generous editorial spacing. The wordmark is a typographic concept rather than an asserted official logo.

## Sources and assumptions
- User reference: https://web.facebook.com/bloomsbymarra/ . Facebook could not be read from this environment.
- Public directory corroborates the business name and Facebook handle: https://www.waze.com/live-map/directions/ph/ncr/valenzuela/blooms-by-marra-flower-shop?to=place.ChIJg6PwCgi3lzMR3nPOZd3ZHlE . Directory details are not used as verified store policies.
- Photography: illustrative Unsplash stock images, not Blooms by Marra's inventory. Replace them with approved product photos before commercial launch.
- No unverified phone numbers, address, delivery territory, reviews, discounts, or availability guarantees are presented.

## Acceptance checks
Product filters/search/sort; detail/size selection; add/update/remove bag; restore bag safely; empty states; order validation; request summary/clipboard fallback; real Messenger link; keyboard dialogs; responsive layout and reduced motion.

## Launch follow-up
Replace sample products, photos, and prices with the approved catalog. Confirm store contact details, delivery coverage/fees, substitution/refund policies, and lead times. Connect a verified payment and order system if direct checkout is desired.
