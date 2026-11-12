# Leaving Wix without losing SEO, Merchant Center or Ads

The safest plan is to **keep every URL exactly as it is**. The new site serves the same paths, so nothing needs a redirect and no Ads final URL changes.

## URLs to keep (serve the same path, return 200)

- Product pages: `/product-page/<slug>`, e.g. `/product-page/canvas-60-40`. Keep the slugs as they are, including the Hebrew-encoded acrylic slugs (`/product-page/הדפסת-תמונה-על-זכוכית-אקרילית-60-על-40`). The prototype `data.js` lists them.
- Category pages: `/canvas`, `/glass`, `/acrylic-glass`, `/storyblock`, `/canvas-wall`, plus any others in the Wix sitemap.
- Before cutover, download `https://www.artpic.shop/sitemap.xml` (and its child sitemaps) and the Search Console "Pages" export. Every URL there either keeps working or gets a 301 to its closest new page.

## Each product URL in the new design

- It opens the studio with that material and size preselected. The H1, `<title>`, meta description and price are rendered on the server for that exact product.
- When the buyer changes material or size, the URL updates to that product's own URL (`history.replaceState`), which is the canonical URL for that combination.
- `Product` JSON-LD with `offers.price` set to **the same sale price as in the Merchant feed** for that URL. A price mismatch on the landing page is the most common cause of Merchant Center disapprovals.
- Unique copy per material, and a size and price table on each category page. That table also gives Google internal links to every size.

## Merchant Center

- Build the new feed from the new catalog and **keep the same item `id`s** as today's Wix feed, so performance history and Shopping campaigns carry over. Export the current feed first to get the ids.
- Keep the same `link` values (the URLs above). Image URLs will move off `static.wixstatic.com`. That's fine, but host the images yourself before switching over.
- Switch the feed and the site on the same day. Then watch Diagnostics for 72 hours.

## Google Ads and analytics

- Final URLs don't change, so no ad edits are needed. Check that `gclid` and UTM parameters survive any redirects.
- Re-install the GA4 tag, Ads conversion tags and Enhanced Conversions on the new checkout before launch. Then test one real order.
- Keep the Search Console property. Submit the new sitemap on launch day.

## Leave out

- The AI-illustration funnel (`/…` upload-page widget): 301 its URL to the home page.
