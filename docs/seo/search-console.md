# Search Console + Bing Webmaster setup

Right now nobody can see what bis-rgv.com ranks for, what Google has indexed, or
what it thinks is broken. This is the instrument panel. It is free, it takes
about fifteen minutes, and every other SEO decision gets better once it exists.

Do **Step 1** and **Step 3**. Step 2 is only if DNS verification gives you
trouble.

---

## Step 1 — Verify with DNS (recommended)

DNS verification covers the apex, `www`, and every subdomain at once, and it
survives redeploys. Vercel runs this zone, so the record goes in the Vercel
dashboard.

1. Go to <https://search.google.com/search-console> and sign in with the Google
   account you want to own this long term (use the business Gmail, not a
   personal one you might lose access to).
2. Choose **Domain** as the property type — not URL prefix — and enter
   `bis-rgv.com`.
3. Google shows a TXT record like `google-site-verification=abc123...`. Copy it.
4. In Vercel: **Domains → bis-rgv.com → DNS Records → Add**.
   - Type `TXT`, Name `@`, Value: the full `google-site-verification=...` string.
5. Back in Search Console, click **Verify**. If it fails, wait a few minutes for
   DNS to propagate and try again.

## Step 2 — Only if DNS verification will not cooperate

The site can serve a verification meta tag instead. It is read from the
environment, so no token is ever committed.

1. In Search Console choose the **URL prefix** property type and enter
   `https://bis-rgv.com`, then pick the **HTML tag** method and copy the
   `content="..."` value (just the token, not the whole tag).
2. In Vercel: **Settings → Environment Variables → Add**
   - Name `GOOGLE_SITE_VERIFICATION`, value the token, environment **Production**.
3. **Redeploy.** These pages are prerendered at build time, so the tag does not
   appear until a new build runs. Setting the variable alone changes nothing.
4. Confirm it is live, then click Verify:
   ```
   curl -s https://bis-rgv.com/en | grep google-site-verification
   ```

`BING_SITE_VERIFICATION` works the same way and renders as `msvalidate.01`.

## Step 3 — Submit the sitemap and connect Bing

1. In Search Console: **Sitemaps → Add a new sitemap → `sitemap.xml` → Submit**.
   The full URL is <https://bis-rgv.com/sitemap.xml> and it currently lists 36
   URLs (18 pages × 2 languages).
2. Use **URL Inspection** on `https://bis-rgv.com/en` and click **Request
   indexing**. Do the same for `/en/work` and `/es/work`. This is the fastest
   way to get a brand-new page looked at.
3. Go to <https://www.bing.com/webmasters>, choose **Import from Google Search
   Console**, and authorize. That carries the property and the sitemap over
   without repeating any of the above — and Bing feeds ChatGPT search results,
   so it is worth the two clicks.

---

## What to look at, and when

Nothing useful appears for a few days, and query data takes two to four weeks to
mean anything. When it does:

- **Pages → Indexed / Not indexed.** Anything in "Discovered – currently not
  indexed" or "Crawled – currently not indexed" is a page Google decided was not
  worth keeping. That is a content-quality signal, not a bug to file.
- **Performance → Queries.** The searches you already appear for, even at
  position 40. Those are the pages worth improving first, because Google has
  already decided you are somewhat relevant to them.
- **Performance → filter to Spanish queries.** The site is fully bilingual and
  most RGV competitors are not. If Spanish impressions are climbing, that is the
  differentiator working.
- **Enhancements.** FAQ, breadcrumb and article rich-result eligibility appear
  here once Google re-crawls.

## Still outstanding, and worth more than any of the above

**Google Business Profile.** The map pack is where local "IT support near me"
traffic actually goes, and it needs a verifiable address — the same blocker as
the Cobija Play listing. A service-area business can hide the address from the
public listing, but cannot skip having one to verify. Until that is resolved,
this site can rank in normal results but cannot appear in the map.
