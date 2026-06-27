# AVANA Showroom Website — Claude Code Project Configuration

## Project Overview

**Stack:** TanStack Start + Vite + Supabase + Framer Motion + Tailwind CSS
**Deploy target:** Cloudflare Workers via Nitro (NOT Pages — do not use the Pages flow)
**Domain:** avanashowroom.com
**Package manager:** npm only — never bun
**Dev server:** `npm run dev` → localhost:8080

---

## Deployment (locked Jun 2026)

**Build command:** `npm run build`
**Deploy command:** `npx wrangler deploy`
**Worker entry:** `.output/server/index.mjs` (full Nitro build — includes all file-system routes in `server/routes/` and middleware in `server/middleware/`; `no_bundle: true`)
**Static assets:** `.output/public/` (served via Workers Assets at the edge; `binding: "ASSETS"`)

`wrangler.jsonc` in the project root is the Workers config — points wrangler at the pre-built output (`main`, `assets.directory`). Without it, `wrangler deploy` tries to auto-configure by modifying `vite.config.ts`, which fails because `@lovable.dev/vite-tanstack-config` wraps the plugins array and there is no bare `plugins: []` to patch.

`bun.lock` is excluded from the repo (`.gitignore`). Cloudflare uses npm 10 with `package-lock.json`. Do not regenerate or commit a bun.lock. `lru-cache@^11` is pinned in `devDependencies` — npm 10's `npm ci` enforces optional peer deps that npm 11 silently skips; removing this pin will break Cloudflare installs.

---

## Permanent Locks

**DNA hero (`DnaColdOpen` in `src/routes/index.tsx`)** — permanently locked. Never modify its layout, spacing, width, or alignment under any circumstance.

**No em dashes** in any user-facing string anywhere on this site.

**First-person "I" voice** in all marketing copy, success messages, and email content.

---

## Key Files

| File | Purpose |
|---|---|
| `src/routes/index.tsx` | Homepage — DNA hero locked |
| `src/routes/ai-by-avana.tsx` | AI by AVANA service page |
| `src/routes/consulting.tsx` | Consulting intake (ConsultingCallModal wired; payment not yet built) |
| `src/routes/become-a-retailer.tsx` | Retailer application + AI waitlist forms |
| `src/routes/meet-the-founder.tsx` | Founder page |
| `src/lib/score-engine/index.ts` | Score engine entry point — runs 10 checks concurrently |
| `src/lib/score-engine/catalog.ts` | Shopify /products.json catalog reads |
| `src/lib/score-engine/crawl.ts` | Homepage fetch + extractBrandText() |
| `src/lib/score-engine/judgment.ts` | Anthropic judgment layer (claude-sonnet-4-6) |
| `src/lib/score-engine/run-test.ts` | CLI test runner: `npx tsx src/lib/score-engine/run-test.ts <url>` |
| `src/lib/score-runner.ts` | Email builders + kickScoreRun server function |
| `src/lib/notify.ts` | Amanda alerts + submitter confirmation emails (see Forms section) |
| `src/lib/availability.ts` | Booking slot generation — Mon–Fri 10:00–20:00 Vancouver, 30-min slots |
| `src/lib/paypal.ts` | PayPal Orders API v2 server functions (createPayPalOrder, capturePayPalOrder) |
| `src/components/ScoreModal.tsx` | Score capture modal (AI Visibility + Health Check) |
| `src/components/DiyAuditModal.tsx` | DIY audit kit — form + PayPal checkout + done (3-step) |
| `src/components/ConsultingCallModal.tsx` | Consulting booking modal — 30 min/$250 or 60 min/$500; bookingType:"consulting" |
| `src/integrations/supabase/client.ts` | Supabase client |
| `src/integrations/supabase/types.ts` | Generated Supabase types — see note below |
| `src/routes/admin/index.tsx` | Admin dashboard — analytics, ops health, lead tables. Archivo font, dark/light theme toggle (localStorage `admin_theme`), CF analytics section. |
| `src/routes/admin/login.tsx` | Admin login — POST to `/api/admin/login`, HttpOnly cookie, rate-limit error display, theme-aware. |
| `server/middleware/admin-auth.ts` | Nitro middleware — guards all `/admin/*` routes, checks `admin_session` cookie vs `ADMIN_TOKEN` |
| `server/routes/api/admin/login.ts` | POST handler — password check, sets 7-day cookie. Rate limiting: 5 failed attempts per IP per 15 min → 429. |
| `server/routes/api/admin/data.ts` | Fetches all 8 Supabase tables + Cloudflare analytics (CF_ZONE_ID + CF_API_TOKEN secrets). Returns `analytics: null` if secrets absent. |
| `server/routes/api/admin/logout.ts` | Clears `admin_session` cookie, redirects to `/admin/login` |
| `public/robots.txt` | Allows all crawlers incl. 12 named AI bots; references sitemap |
| `public/sitemap.xml` | All 5 routes with priorities |
| `public/llms.txt` | Plain-text AVANA profile for AI context windows |

---

## Supabase Tables

| Table | In types.ts | Notes |
|---|---|---|
| `score_leads` | ✓ | Score modal captures |
| `audit_kit_leads` | ✓ | DIY audit kit — has `paid`, `paid_at`, `paypal_order_id` columns |
| `insider_subscribers` | ✓ | Email list |
| `market_hitch_waitlist` | ✓ | Market Hitch early access |
| `retailer_applications` | ✓ | Retailer form |
| `consulting_intake` | ✓ | Schema matches prod. types.ts regenerated Jun 2026. |
| `consult_call_bookings` | ✓ | Booking slots — has `booking_type`, `duration_minutes`, `amount_cents` |

---

## Forms, Notifications & Emails

### notify.ts — two exported server functions

`notifyLead` — internal alert to `amanda@avanashowroom.com`. Always fire-and-forget (non-blocking try/catch at call site).

`confirmSubmitter` — best-effort confirmation to the person who submitted. Never throws. Wrap in try/catch at call site; an email failure must never block the user's submission.

### Email builders (notify.ts)

| Function | Used on | Subject |
|---|---|---|
| `retailerConfirmationEmail(firstName, storeName)` | Retailer application submit | "I received your retailer application" |
| `consultingConfirmationEmail(firstName, areas)` | Consulting intake submit | "I received your note" |
| `waitlistConfirmationEmail(firstName)` | Retailer AI waitlist submit | "You're on the list" |

All use `from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>'`, `replyTo: 'amanda@avanashowroom.com'`, `RESEND_API_KEY` env var. No em dashes. First-person "I" voice throughout.

### DiyAuditModal — two-alert kit flow

1. On form submit (before payment): `notifyLead` fires with subject `"Kit lead (not yet paid) — {firstName} {email}"`. Captures abandoned leads.
2. On PayPal capture success: `capturePayPalOrder` in `src/lib/paypal.ts` fires fulfillment — marks `paid=true` in `audit_kit_leads`, emails kit to buyer, alerts Amanda "Kit PAID".

Query `audit_kit_leads WHERE paid=false` for abandoned leads; `WHERE paid=true` for buyers.

### Availability config (locked Jun 2026)

`src/lib/availability.ts` — `SCHEDULE_CONFIG`:
- Timezone: `America/Vancouver`
- Days: Mon–Fri (weekdays 1–5)
- Hours: 10:00–20:00 Vancouver
- Slot size: 30 min
- Lead time: 24h minimum
- Window: 21 days ahead
- 60-min bookings: last valid start = 19:30 (two consecutive 30-min blocks must both be within the 10–20 window)

### ConsultingCallModal — locked decisions (Jun 2026)

`src/components/ConsultingCallModal.tsx` — consulting-specific 4-step modal (form → slots → payment → done).
- Duration selector: 30 min/$250 or 60 min/$500 as side-by-side cards
- `bookingType: "consulting"` explicitly set — never reuse the AI first-call modal for this page
- PayPal container: `#consulting-paypal-btn-container` (distinct from DiyAuditModal's `#paypal-btn-container`)
- No deposit/credit language anywhere in this modal
- Payment for consulting calls is NOT yet wired — the modal shows slots and form but PayPal is TODO

---

## SEO / GEO Infrastructure (Jun 2026)

### Static files

| File | Purpose |
|---|---|
| `public/robots.txt` | Allows all crawlers; explicitly names 12 AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.) |
| `public/sitemap.xml` | 5 routes with priorities; `lastmod` should be updated on content changes |
| `public/llms.txt` | Plain-text AVANA profile — who, services, key pages, contact. Read by AI summarizers. |

### Per-route metadata (all routes as of Jun 2026)

Every route now has: `title`, `description`, `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `canonical` link.

OG images are **interim** (not proper 1200x630 crops):
- Homepage, `/ai-by-avana`, `/become-a-retailer`: `avana-logo.png`
- `/consulting`: `consulting-image.png`
- `/meet-the-founder`: `amanda-founder.png`

A dedicated 1200x630 OG image for each route is a remaining P2 design task.

### JSON-LD structured data

| Route | Schema type | Notes |
|---|---|---|
| `/` | `Organization` | name, url, logo, founder ref, contactPoint |
| `/ai-by-avana` | `Service` | provider, description, audience ($250K–$10M fashion brands) |
| `/meet-the-founder` | `Person` | Amanda Vanas — jobTitle, worksFor, image, sameAs TTF |

Injected as `<script type="application/ld+json" dangerouslySetInnerHTML>` at top of each component return — in `<body>`, which is valid per Google's spec.

### H1 architecture (locked Jun 2026)

**One `<h1>` per page** — confirmed by `curl` + Python parse of SSR HTML. All 5 routes pass.

| Route | H1 | Notes |
|---|---|---|
| `/` | "Some brands you discover. Others are chosen for you." | From `HeroIntro` component |
| `/ai-by-avana` | "You don't need more staff..." | Desktop animated path; mobile early-return (reduced-motion only) uses aria-hidden div |
| `/consulting` | "Consulting with Amanda Van As: wholesale, ecommerce and AI strategy" | `sr-only` — visible heading is `<h2>`. See below. |
| `/meet-the-founder` | "Amanda Vanas" | In `md:hidden` mobile section — visible and crawlable on mobile-first |
| `/become-a-retailer` | "They ship to you. They sell for you." | From hero component |

**`/consulting` sr-only pattern:** Single `<h1 className="sr-only">` sits above both the `hidden md:grid` (desktop) and `md:hidden` (mobile) splits — always in DOM at every viewport, never `display:none`. Tailwind `sr-only` = `clip-path:inset(50%) position:absolute` (confirmed in compiled CSS — NOT display:none). Both visible headings ("Are you ready to work!" desktop, "Hello." mobile) are `<h2>`.

**`/meet-the-founder` swap:** Mobile `<h1>` "Amanda Vanas" is the canonical heading (visible to mobile-first Google crawler). Desktop duplicate demoted to `<h2>` (inside `hidden md:block` — same visual result, correct semantics).

**Do not add a second `<h1>` to any route** without updating this section.

### SSR verification (Jun 2026)

All 5 routes confirmed server-rendered: meaningful brand/service/founder text present in raw `curl` response. Non-JS crawlers and AI bots get full content. This is the baseline for the site passing its own AI-visibility test.

---

## Score Engine — Locked Decisions

### Product catalog reads

Product data checks read from Shopify's public `/products.json?limit=250&page=N` endpoint, NOT from scraping product pages. Shopify renders `body_html` (product descriptions) server-side in this endpoint — HTML scraping misses it because the storefront renders client-side via JS.

`fetchCatalogData()` in `src/lib/score-engine/catalog.ts`:
- Fetches up to 2 pages × 250 products
- 401/403 → `blocked: true`, all checks that use catalog gracefully degrade
- Strips HTML from `body_html` before word counting
- Counts `images[].alt` meaningful alt text (length > 3)
- Counts system tags (starting with `__`)

### extractBrandText() — must skip `<head>`

Shopify pages front-load 8000+ chars of `<head>` CSS font-face declarations, preload links, and metadata before any visible brand copy. `extractBrandText()` in `crawl.ts` finds the `<body` tag index and slices from there (12000 chars), then strips scripts/styles/noscript.

**Do not revert to `html.slice(0, 8000)`** — it returns raw CSS, not brand copy.

### Conservative scoring philosophy

- **Email / checkout**: band caps at `partial` regardless of signals — automation depth, conversion rate, and cart abandonment are not readable from public pages
- **Catalog alt text < 30%**: caps both `seo_geo_foundations` and product data at `partial` even when homepage signals are 5/5
- `surfaceReadNote` in every email explains what the engine cannot access
- Paid audit always reveals more than the surface scan — the score must under-promise

### PageSpeed timeout

`checkMobilePerformance()` uses 55,000ms timeout. erikapena.com takes ~43s. Do not reduce below 55s.

### Anthropic judgment layer

`checkBrandContentConsistency()` in `src/lib/score-engine/judgment.ts`:
- Model: `claude-sonnet-4-6`, max_tokens: 256, 20s timeout
- Graceful stub on 400/401/402/403 (400 = credit balance too low, not 402)
- Tone: candid and specific, constructive not contemptuous — "Reads like a catalog" OK, "Masquerading as a brand" not

### SEO check evidence — `<title>` bug (fixed, do not revert)

`seo-geo-foundations.ts` line 17 previously wrote `<title>: present` into the evidence string. When injected into email HTML, Gmail treated `<title>` as a head element and stripped the entire rest of the email body. Fixed to `title tag: present`. **Do not revert to angle-bracket form.**

---

## Admin Dashboard — Locked Decisions (Jun 2026)

### Font
Archivo, weights 400;500;600;700;800. Loaded via Google Fonts in `src/routes/__root.tsx`. All admin inline styles use `fontFamily: 'Archivo, Arial, Helvetica, sans-serif'` — do not revert to bare Arial.

### Dark / Light Theme
Theme state lives in `src/routes/admin/index.tsx` and `src/routes/admin/login.tsx`. Persisted to `localStorage` key `admin_theme` (`'dark'` | `'light'`). Default: `'dark'`. Toggle button (sun/moon SVG) in dashboard header header. `THEMES` object with `dark` and `light` token sets; `ThemeCtx` React context propagated via `useT()` hook to all sub-components. Both admin pages read localStorage on mount.

### Cloudflare Analytics
`fetchCFAnalytics()` in `server/routes/api/admin/data.ts` queries Cloudflare's GraphQL API.

**Dataset:** `httpRequests1dGroups` — daily rollup, supports 30-day range, fields `sum { pageViews requests }`. Do NOT use `httpRequestsAdaptiveGroups` — it has a 1-day range limit on the free plan and different field names.

**Secrets required (set via `npx wrangler secret put`):**
- `CF_ZONE_ID` — zone ID from the Cloudflare dashboard zone overview sidebar
- `CF_API_TOKEN` — API token with "Read analytics for a zone" permission (use the template; `Analytics:Read` only)

If either secret is absent, the endpoint returns `analytics: null` and the dashboard shows "Analytics not configured" — graceful, not an error.

**Note on field naming:** `sum.pageViews` = actual page view count; `sum.requests` = total HTTP requests (higher). Dashboard shows `sum.pageViews` as "visitors" and `sum.requests` as "page views" — aligned to what CF labels them in the UI.

### Rate Limiting (Login)
Module-level `Map<string, { count: number; resetAt: number }>` in `server/routes/api/admin/login.ts`. IP sourced from `cf-connecting-ip` header (Cloudflare sets this) with fallback to `x-forwarded-for`. 5 failed attempts per IP per 15-minute window → HTTP 429. Successful login clears the entry. Login page detects 429 and shows "Too many attempts. Try again in 15 minutes." **Caveat:** in-memory state does not persist across CF Worker PoP restarts — effective against automated attacks but not distributed multi-PoP bypass.

### Cursor Restore
Global `cursor: none` in `src/styles.css` applies to the whole site. Admin pages need it restored. Solution: `admin-cursor` class in `styles.css` that sets `cursor: auto !important` on the root div and `cursor: pointer !important` on interactive elements. Both `src/routes/admin/index.tsx` and `src/routes/admin/login.tsx` have `className="admin-cursor"` on their root div. Do not remove this class.

### Revenue Section
The revenue section (kit sales, booking revenue, `revenueByDay` chart) has been removed from the dashboard UI. The data is still fetched and computed in `data.ts` (removing it would break the response shape) but nothing in `index.tsx` renders it.

---

## Cloudflare Worker Secrets — Critical Notes

**Tab-character pitfall (burned Jun 2026):** If `RESEND_API_KEY` or `PAGESPEED_API_KEY` were set via paste (clipboard sometimes appends a trailing tab), `env.RESEND_API_KEY` returns `"actualvalue\t"` and lookups silently fail. The secret name `RESEND_API_KEY\t` appears as a distinct entry in `wrangler secret list`.

**Always set secrets as:**
```bash
echo "your_actual_value" | npx wrangler secret put RESEND_API_KEY
```
Never paste directly into a `wrangler secret put` interactive prompt if the clipboard could add whitespace.

If emails or PageSpeed stop working and the API keys look correct, check `wrangler secret list` for tab-suffixed duplicates.

---

## Email Deliverability — Locked (Jun 2026)

**SPF record for `mail.avanashowroom.com`** (Resend sending subdomain):
```
TXT mail.avanashowroom.com  v=spf1 include:_spf.resend.com ~all
```
Added Jun 2026. Without this, Resend-sent emails from `@mail.avanashowroom.com` fail SPF and land in spam. The parent domain `avanashowroom.com` SPF only authorizes Google — it does NOT cover the subdomain.

**DKIM:** `resend._domainkey.mail.avanashowroom.com` CNAME — was correct before this fix.

**Amanda CC pattern:** `kickScoreRun` in `src/lib/score-runner.ts` sends the client report with `cc: 'amanda@avanashowroom.com'` on the same `resend.emails.send()` call. Do NOT use a separate second call for the Amanda copy — it fails silently when the first call succeeds. One call, `cc:` field, guaranteed delivery.

---

## Email Templates — Locked Decisions

### Resend config

```
from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>'
replyTo: 'amanda@avanashowroom.com'
Key env var: RESEND_API_KEY (in .env)
```

Both emails use table-based HTML with inline styles only. No external CSS, no flexbox/grid, no `<style>` blocks — Gmail strips them.

### Font sizes (locked Jun 2026 — "perfect, lock it")

| Element | Size |
|---|---|
| Eyebrow labels (AI BY AVANA, section headers) | 11px |
| Band chip text | 11px |
| Surface read note, footer, /20 label | 13px |
| Check evidence, dimension explanations, needsInput bullets | 14px |
| Check labels, dimension labels | 15px |
| Body copy, biggest leak callout, CTA body, personal note | 16px |
| Verdict text, CTA headline | 17px |
| /100 span, dimension score number | 22px |
| H1 (email title) | 30px |
| Main score number | 42px |

### spacerRow() — NEVER use inside `<td>` cells

`spacerRow(h)` emits `<tr><td style="height:Npx">` — a table row. A `<tr>` cannot be a direct child of `<td>`. Gmail's parser performs foster parenting: moves the stray `<tr>` out, breaking the surrounding padding context and causing content to lose its left indent.

**Rule:** `spacerRow()` is only valid at the top level of the outer email `<table>`, between `<tr><td>` blocks. Inside a `<td>`, use `divSpacer(h)` instead, which emits a `<div style="height:Npx">`.

Both helpers are defined in `src/lib/score-runner.ts`.

### htmlEscape() — always apply to dynamic content

`htmlEscape()` in `src/lib/score-runner.ts` must be applied to all dynamic content inserted into email HTML — particularly `c.label` and the output of `healthFinding(c)` in the checks loop. Evidence strings can contain `<`, `>`, `&` characters that corrupt HTML parsing in email clients.

### healthFinding() — Health Check row copy (locked Jun 2026)

`healthFinding(check: CheckResult)` in `src/lib/score-runner.ts` translates raw pipe-delimited engine evidence into a human-readable finding per check. Switches on `check.id` and `check.band`, extracts real numbers from the evidence string via regex (`extractEv()` helper), and returns a specific first-person sentence. Do NOT revert to rendering `c.evidence` directly in the check row — that was the old debug-string behaviour.

- `brand_content_consistency` is the only check that returns `check.evidence` as-is — Claude already writes a human sentence as its evidence output.
- All generated copy: no em dashes, first-person "I" voice, uses real numbers (product count, LCP, alt%, etc.).

### specificBiggestLeak() — Biggest Leak callout (locked Jun 2026)

`specificBiggestLeak(checks: CheckResult[])` in `src/lib/score-runner.ts` generates the Biggest Leak sentence for **both** emails. Uses the same priority order as `findBiggestLeak()` in the engine, but produces specific copy with real numbers from the winning check's evidence. Both `buildHealthCheckEmail` and `buildVisibilityEmail` call this — `visibility.biggestLeak` is no longer used in either template.

Key cases: `mobile_performance` → includes LCP and multiplier vs 2.5s threshold. `email_retention` PARTIAL → specific to automation depth being unverifiable (not "no ESP detected"). `email_retention` FAIL → "gone permanently" language.

### Check row layout — single shared table (locked Jun 2026)

The 10 Health Check rows are direct `<tr>` rows in **one shared outer table**, not nested per-row inner tables. This is the only way to guarantee the chip column is the same width across all rows in Gmail.

```html
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="96" style="width:96px;vertical-align:top;padding:14px 12px 14px 0;border-bottom:...">
      chip
    </td>
    <td style="vertical-align:top;padding:14px 0;border-bottom:...">
      label + finding
    </td>
  </tr>
  <!-- × 10 rows -->
</table>
```

**Do NOT revert to nested per-row inner tables.** When each row has its own `<table>`, Gmail calculates column widths independently per row — PASS chip (~45px) and PARTIAL chip (~78px) produce different text start positions, breaking alignment. A single shared table forces all rows to share the same column widths.

The band chip span has `white-space:nowrap` to prevent "NEEDS WORK" wrapping to two lines. Both the `width="96"` HTML attribute and `width:96px` CSS style are set on the chip td — HTML attribute is more reliable in email clients that ignore CSS width.

### ScoreModal — Duplicate Submission Guard (Jun 2026)

Supabase returns error code `23505` (unique constraint violation) when the same email+type combo is submitted twice. `ScoreModal.tsx` detects this:
- Sets `done: true` so the user sees the success screen (they already submitted — no error shown)
- Skips `notifyLead` (no duplicate internal alert)
- Skips `kickScoreRun` (score already ran; do not re-run or re-send the report)

To clear a test email for re-testing: delete the row from `score_leads` in Supabase.

---

### Async fire-and-forget pattern

`kickScoreRun` is a TanStack Start server function that fires `runScoreAndEmail()` without awaiting and returns `{ started: true }` immediately. This works on Node.js (dev server process stays alive).

**On Cloudflare Workers:** `kickScoreRun` handler reads `event.req.waitUntil` (bound by Nitro's augmentReq from the CF ExecutionContext) and passes the task to it. Branch logging confirms which path runs: `waitUntil path: cloudflare-ctx` vs `fallback-no-ctx`. Fixed Jun 2026.

### Health Check vs AI Visibility email

- **Health Check** (`buildHealthCheckEmail`): 10 check rows — band chip + check label + `healthFinding(c)` human sentence. No per-check numeric score.
- **AI Visibility** (`buildVisibilityEmail`): 5 dimension rows — numeric /20 score + label + band chip + plain-English `d.explanation` paragraph. Also includes "This score cannot include:" bullet section.
- Both source `biggestLeak` from `specificBiggestLeak(result.checks)` — NOT `visibility.biggestLeak`.
- `scoreHealthCheck()` returns the full `CheckResult[]` array unchanged — nothing is stripped.

---

## Page Layout System

**Standard section pattern:**
- Section wrapper: `px-[clamp(1.5rem,5vw,4rem)] py-20 md:py-28`
- Inner content: `mx-auto max-w-[1140px]` (no extra `px-` on inner div)
- Section divider: `borderTop: 1px solid rgba(184,144,46,0.12)`
- Headings: left-aligned across all body sections

**Full-bleed exceptions (no 1140px constraint):**
- What We Build circle row: full-bleed
- Executive Tiles circle board: fluid/centered

---

## Known TODOs (as of Jun 2026)

| Priority | Item | File |
|---|---|---|
| P0 | ~~Regenerate `types.ts` for `consulting_intake`~~ — done Jun 2026 | `src/integrations/supabase/types.ts` |
| P1 | Wire PayPal payment to ConsultingCallModal (30 min/$250, 60 min/$500) | `src/components/ConsultingCallModal.tsx` |
| P2 | Proper 1200x630 OG images per route (interim images in place) | `public/` + all route `head()` |
| P2 | ~~Cloudflare Workers `ctx.waitUntil()` for score runner~~ — done Jun 2026 | `src/lib/score-runner.ts` |
| P3 | Fix `PreviousClients.tsx:75` — remove invalid `WebkitMaskMode` | `src/components/PreviousClients.tsx` |
| P3 | Compress or CDN `public/erika-pena-x-avana.mp4` (201 MB) | `public/` |
| P3 | Bundle size 790 KB main chunk — add dynamic imports | build config |

**Completed (Jun 2026):**
- PayPal $297 DIY Audit Kit checkout + fulfillment (DiyAuditModal — 3-step, kit email + Amanda alert)
- Amanda inbox notifications for all forms (Retailer application, Consulting intake, AI waitlist, DIY kit lead)
- Submitter confirmation emails (Retailer, Consulting, Waitlist)
- `robots.txt`, `sitemap.xml`, `llms.txt`
- Full og/twitter/canonical metadata on all 5 routes
- JSON-LD structured data (Organization, Service, Person)
- Single h1 per page across all routes — mobile-first indexing safe
- SSR verified: all meaningful text server-rendered

---

## DEPLOY-TIME MUST-FIXES (works locally, WILL break on Cloudflare if not fixed)

Do not deploy without clearing these. They work on local Node dev and silently fail on Cloudflare Pages/Workers.

1. **Kit PDF delivery uses `fs.readFileSync`** (`src/lib/kit-fulfillment.ts`). There is NO filesystem on Cloudflare Workers — PDF delivery WILL break on deploy. FIX: move the kit PDF to Supabase Storage and attach/deliver via a signed URL. Same applies to any other `fs` read at request time.

2. ~~**Async score runner**~~ — **FIXED Jun 2026**: `kickScoreRun` uses `event.req.waitUntil` (Nitro's augmented Request) to keep the Worker alive. Branch logging confirms path in prod logs.

3. **PayPal webhook built (`server/routes/api/webhooks/paypal.ts`) — register at deploy**: At deploy, register the live webhook at `https://avanashowroom.com/api/webhooks/paypal`, subscribe to `PAYMENT.CAPTURE.COMPLETED`, paste the Webhook ID into Cloudflare env as `PAYPAL_WEBHOOK_ID`, and REMOVE `PAYPAL_SKIP_WEBHOOK_SIG`. Handles both kit ($297) and booking ($250/$500) payments. Signature verification uses PayPal's verify-webhook-signature REST API — no Node crypto, Workers-compatible. `waitUntil` used for fulfillment (same pattern as score runner). Idempotency guard on `paid` field for both tables.

4. **PayPal go-live:** currently sandbox. To go live: set `PAYPAL_ENV=live` + live `CLIENT_ID`/`SECRET` + live webhook ID. No code changes needed beyond env vars and webhook registration.

5. **All API keys must be added to Cloudflare Pages env vars** (not just local `.env`). Missing keys = silent runtime failures.

   Required: `RESEND_API_KEY`, `PAGESPEED_API_KEY`, `ANTHROPIC_API_KEY`, `VITE_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_ENV`, `PAYPAL_WEBHOOK_ID`, `SUPABASE_SERVICE_ROLE_KEY`, Supabase URL + anon key, `ADMIN_PASSWORD` (the login password for `/admin`), `ADMIN_TOKEN` (the session cookie value — generate a random 32+ char string, keep it secret), `CF_ZONE_ID` + `CF_API_TOKEN` (optional — analytics section shows "not configured" if absent).

---

## Key Security (do not "fix" these incorrectly)

- **`VITE_PAYPAL_CLIENT_ID` is intentionally bundled to the client.** A PayPal Client ID is public by design — it appears in the SDK URL. This is NOT a leak. Do not remove the `VITE_` prefix thinking it is a security issue; the SDK requires it client-side.

- **`PAYPAL_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only.** Never bundle to client, never log, never screenshot. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS (full admin access) and is used for payment-confirmation writes (marking rows paid). Treat as the most sensitive credential in the project.

- **Verify at build:** `grep dist/client` for `PAYPAL_SECRET` and the service_role key value — both must return empty.

---

## Email Render — Do Not Revert (silent email-body killers)

- **`htmlEscape()` MUST be applied** to score-check `c.evidence` and `c.label` before injecting into report email HTML. An unescaped `<title>` string in SEO evidence was parsed as a real HTML tag and ate the entire Health Check email body (rendered ~2 lines). Do not remove the escaping.

- **Do NOT put `spacerRow()` inside a `<td>`.** Gmail foster-parenting relocates it and breaks layout. Use `divSpacer()` inside table cells. See Email Templates section above.

---

## Post-Market-Hitch Note

When the Market Hitch page is built, it adds an audience (buyer/brand) column to `market_hitch_waitlist` — update the Supabase Tables section above once that lands. Also add `/market-hitch` to `public/sitemap.xml`.
