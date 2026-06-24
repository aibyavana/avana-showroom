import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { runScore, type ScoreResult, type HealthCheckScore, type VisibilityScore } from './score-engine/index'
import type { CheckResult } from './score-engine/rubric'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScoreRunPayload = {
  firstName: string
  email: string
  storeUrl: string
  type: 'ai_visibility' | 'shopify_health'
}

// ── Color / band helpers ───────────────────────────────────────────────────────

const DARK = '#0A0A0F'
const CREAM = '#F7F4EF'
const CREAM_DIM = 'rgba(247,244,239,0.65)'
const GOLD = '#B8902E'
const GOLD_LIGHT = '#E8C36A'
const DIVIDER = 'rgba(184,144,46,0.18)'

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bandChip(band: string): string {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pass:    { bg: 'rgba(76,175,80,0.15)',   fg: '#5DBF63', label: 'PASS' },
    partial: { bg: 'rgba(255,184,0,0.15)',   fg: '#D4A017', label: 'PARTIAL' },
    fail:    { bg: 'rgba(255,107,107,0.15)', fg: '#FF7A7A', label: 'NEEDS WORK' },
    pending: { bg: 'rgba(158,158,158,0.15)', fg: '#9E9E9E', label: 'PENDING' },
  }
  const c = map[band] ?? map.pending
  return `<span style="display:inline-block;padding:2px 8px;background:${c.bg};color:${c.fg};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-radius:2px;white-space:nowrap">${c.label}</span>`
}

function scoreBar(score: number, max: number = 100): string {
  const pct = Math.max(0, Math.min(100, (score / max) * 100))
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:4px;background:rgba(184,144,46,0.15);border-radius:2px;overflow:hidden"><table width="${pct}%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:4px;background:linear-gradient(to right,${GOLD},${GOLD_LIGHT});border-radius:2px">&nbsp;</td></tr></table></td></tr></table>`
}

function dividerRow(): string {
  return `<tr><td style="padding:0 40px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:${DIVIDER};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>`
}

function spacerRow(h: number): string {
  return `<tr><td style="height:${h}px;font-size:0;line-height:0">&nbsp;</td></tr>`
}

// Use divSpacer() inside <td> cells — spacerRow() emits a <tr> which is invalid inside <td>
function divSpacer(h: number): string {
  return `<div style="height:${h}px;font-size:0;line-height:0">&nbsp;</div>`
}

// ── Evidence extraction helper ─────────────────────────────────────────────────

function extractEv(evidence: string, pattern: RegExp): string | null {
  const m = evidence.match(pattern)
  return m ? m[1].trim() : null
}

// ── Per-check human finding ────────────────────────────────────────────────────

function healthFinding(check: CheckResult): string {
  const ev = check.evidence

  switch (check.id) {
    case 'ai_search_visibility': {
      if (check.band === 'pass') {
        const altPct = extractEv(ev, /Product image alt text: (\d+)%/)
        const altNote = altPct !== null && parseInt(altPct) < 30
          ? ` One gap: ${altPct}% of your product images have alt text, so AI tools can read your pages but cannot interpret your product photos.`
          : ''
        return `Your store is readable by AI search. You have an llms.txt file and an agentic discovery sitemap, and nothing in robots.txt blocks AI crawlers.${altNote}`
      }
      if (check.band === 'fail') {
        return `AI search crawlers are blocked. Your store will not appear when AI tools like ChatGPT Shopping or Perplexity surface product recommendations, regardless of how strong your other SEO is.`
      }
      const llmsPresent = ev.includes('llms.txt: present')
      return `${llmsPresent ? 'You have an llms.txt file' : 'No llms.txt file found'}, and AI crawlers are not blocked. The store is passively accessible to AI search but not actively set up for it.`
    }

    case 'seo_geo_foundations': {
      const altPct = extractEv(ev, /Product image alt text \(catalog-wide\): (\d+)%/)
      if (check.band === 'pass') {
        return `Your homepage SEO is clean -- all key signals in place including title, meta description, Open Graph, canonical, and structured data. Product image alt text is in good shape across the catalog too.`
      }
      if (check.band === 'fail') {
        return `Core SEO signals are missing on key pages. Without title tags, meta descriptions, and structured data, search engines cannot accurately represent this store.`
      }
      const altLine = altPct !== null
        ? ` The gap is catalog-wide: ${altPct}% of your product images have meaningful alt text, so search engines and AI tools cannot read what is actually in your product photos.`
        : ''
      return `Your homepage SEO is clean -- title, meta description, Open Graph, canonical, and structured data are all in place.${altLine}`
    }

    case 'product_data_completeness': {
      const count = extractEv(ev, /(\d+) products sampled/)
      const avg = extractEv(ev, /Avg description: (\d+) words/)
      const under50 = extractEv(ev, /Under 50 words: (\d+)%/)
      if (check.band === 'pass') {
        return `I sampled ${count ?? 'your'} products. Descriptions are solid (averaging ${avg ?? '?'} words) and clear the 50-word minimum. Image alt text is in good shape too.`
      }
      if (check.band === 'fail') {
        return `Product data is critically thin. ${count ? `I sampled ${count} products --` : ''} descriptions are missing or near-empty, and 0% have image alt text. AI tools and search engines cannot represent your range accurately.`
      }
      const descLine = avg && under50
        ? `Your descriptions exist (averaging ${avg} words) but ${under50}% run under 50 words, which is thin for search and AI.`
        : 'Product descriptions are present but inconsistent in depth.'
      return `I sampled ${count ?? 'your'} products. ${descLine} And 0% of products have image alt text. Note: Shopify SEO meta fields are separate and not visible from outside -- the full audit checks those directly.`
    }

    case 'catalog_structure': {
      const collections = extractEv(ev, /Collections found in sitemap: (\d+)/)
      const tags = extractEv(ev, /Avg tags per product: ([\d.]+)/)
      if (check.band === 'pass') {
        return `Your catalog is well organised${collections ? ` -- ${collections} collections` : ''}, clean naming, working filters${tags ? `, and an average of ${tags} tags per product` : ''}. This is a genuine strength.`
      }
      return `Catalog structure has gaps -- either collection naming, filtering, or tagging needs attention. Buyers navigating the range may hit friction.`
    }

    case 'email_retention': {
      const esp = extractEv(ev, /ESP detected: ([^|]+)/)
      if (check.band === 'fail') {
        return `No email capture or ESP detected. Every visitor who leaves without buying is gone permanently -- there is nothing to bring them back.`
      }
      if (check.band === 'pass') {
        return `Email infrastructure looks solid -- ${esp ?? 'an ESP'} detected, signup on the homepage, and automation signals in place.`
      }
      return `${esp ? `You have email running (${esp}) with a newsletter signup on your homepage.` : 'Email capture is on your homepage.'} What I cannot see from outside is the depth -- whether your flows (welcome, abandoned cart, post-purchase, win-back) are actually built and performing. That is usually where the biggest quick revenue is hiding.`
    }

    case 'checkout_conversion': {
      const accel = extractEv(ev, /Accelerated checkout detected: ([^|]+)/)
      if (check.band === 'fail') {
        return `Something is blocking or degrading the checkout flow. This is the highest-cost problem on any store -- fix before anything else.`
      }
      if (check.band === 'pass') {
        return `Your store is live, the cart works${accel ? `, and you have accelerated checkout (${accel})` : ''}. Checkout is not the bottleneck.`
      }
      return `${accel ? `Your store is live, the cart works, and you have accelerated checkout (${accel}).` : 'Your store is live and the cart is accessible.'} I cannot see conversion rate or cart abandonment from outside -- the full audit reads those directly, and they are often where the real money is leaking.`
    }

    case 'paid_traffic_tracking': {
      const detected = extractEv(ev, /Pixels detected: ([^|]+)/)
      const notDetected = extractEv(ev, /Not detected: ([^|]+)/)
      if (check.band === 'fail') {
        return `No tracking pixels found. You are spending on traffic with no way to measure what converts, retarget visitors, or optimise campaigns.`
      }
      if (check.band === 'pass') {
        return `Tracking stack is solid -- ${detected ?? 'major pixels'} detected. You can see where traffic is coming from and optimise paid spend.`
      }
      const detLine = detected && detected !== 'none' ? `You have ${detected} tracking` : 'Some tracking is in place'
      const missingMeta = notDetected?.includes('Meta Pixel')
      const missingLine = missingMeta
        ? ' For a fashion brand, the missing Meta Pixel is a real gap -- you cannot retarget people who almost bought, or see which campaigns actually drive sales.'
        : notDetected ? ` Missing: ${notDetected}.` : ''
      return `${detLine}, but the stack is incomplete.${missingLine}`
    }

    case 'wholesale_readiness': {
      const b2b = extractEv(ev, /B2B platforms on homepage: ([^|]+)/)
      if (check.band === 'fail') {
        return `No wholesale or B2B infrastructure visible. For a brand with wholesale potential, this is a full revenue channel that does not exist yet.`
      }
      if (check.band === 'pass') {
        return `B2B infrastructure is visible and accessible. Wholesale buyers can find what they need.`
      }
      return `${b2b ? `You mention wholesale and B2B platforms (${b2b}) on your homepage` : 'Wholesale is mentioned on your homepage'}, but there is no dedicated wholesale page where buyers can find terms and line sheets. The intent is there without the infrastructure.`
    }

    case 'mobile_performance': {
      const score = extractEv(ev, /PageSpeed mobile: (\d+)\/100/)
      const lcp = extractEv(ev, /LCP: ([\d.]+)s/)
      if (check.band === 'fail') {
        const multiplier = lcp ? Math.round(parseFloat(lcp) / 2.5) : null
        return `This is your biggest leak. Your mobile PageSpeed is ${score ?? '?'}/100 with a largest-contentful-paint of ${lcp ?? '?'}s${multiplier && multiplier > 1 ? ` -- roughly ${multiplier}x slower than the threshold where shoppers start leaving` : ''}. On mobile, where most fashion traffic lives, a slow load is silently costing you sales every day.`
      }
      if (check.band === 'partial') {
        return `Mobile performance is borderline -- PageSpeed ${score ?? '?'}/100 and LCP ${lcp ?? '?'}s. Not a crisis, but worth attention; fashion shoppers on mobile are quick to abandon.`
      }
      return `Mobile performance is solid -- PageSpeed ${score ?? '?'}/100 and LCP ${lcp ?? '?'}s. This is not slowing down your conversions.`
    }

    default:
      // brand_content_consistency: Claude already returns a human sentence as evidence
      return check.evidence
  }
}

// ── Specific biggest-leak sentence (uses real evidence numbers) ────────────────

function specificBiggestLeak(checks: CheckResult[]): string {
  // FAILs first — a FAIL is always a concrete, verifiable absence.
  // Ordered by revenue impact.
  const failPriority = [
    'mobile_performance', 'email_retention', 'seo_geo_foundations',
    'product_data_completeness', 'paid_traffic_tracking', 'ai_search_visibility',
    'wholesale_readiness', 'checkout_conversion', 'catalog_structure', 'brand_content_consistency',
  ]
  // PARTIALs — verifiable, number-backed findings come first.
  // email_retention and checkout_conversion PARTIAL are inherently unverifiable from the outside
  // ("cannot see automation depth / conversion rate") so they are last-resort only.
  const partialPriority = [
    'mobile_performance', 'seo_geo_foundations', 'product_data_completeness',
    'paid_traffic_tracking', 'ai_search_visibility', 'wholesale_readiness',
    'catalog_structure', 'brand_content_consistency', 'email_retention', 'checkout_conversion',
  ]
  const fails = checks.filter(c => c.band === 'fail')
  const partials = checks.filter(c => c.band === 'partial')

  // mobile_performance is only usable as biggest leak when we have real data.
  // If all PageSpeed calls timed out, its evidence has no "LCP:" — skip it so we
  // fall through to the next verifiable check rather than printing "load time is ?s".
  const hasData = (c: CheckResult) =>
    c.id !== 'mobile_performance' || c.evidence.includes('PageSpeed mobile:')

  const leakId =
    failPriority.find(id => fails.some(c => c.id === id && hasData(c))) ??
    partialPriority.find(id => partials.some(c => c.id === id && hasData(c)))

  if (!leakId) return 'No critical leaks detected across the ten checks.'
  const check = checks.find(c => c.id === leakId)
  if (!check) return 'No critical leaks detected across the ten checks.'
  const ev = check.evidence

  switch (leakId) {
    case 'mobile_performance': {
      const lcp = extractEv(ev, /LCP: ([\d.]+)s/)
      const multiplier = lcp ? Math.round(parseFloat(lcp) / 2.5) : null
      return `Mobile performance. Your mobile load time is ${lcp ?? '?'}s${multiplier && multiplier > 1 ? `, roughly ${multiplier}x past the point where shoppers abandon` : ''}. On the channel where most of your traffic lives, this is quietly costing you sales every day.`
    }
    case 'ai_search_visibility':
      return 'AI search visibility. Your store is blocked from or unreadable by AI search tools -- meaning ChatGPT Shopping, Perplexity, and similar tools will not surface your products regardless of how strong your other SEO is.'
    case 'email_retention': {
      if (check.band === 'fail') {
        return 'Email capture. Every visitor who leaves without buying is gone permanently -- there is no email capture or ESP in place to bring them back.'
      }
      const esp = extractEv(ev, /ESP detected: ([^|]+)/)
      return `Email depth. You have ${esp ?? 'email'} running, but the automation layer is unverifiable from outside. Welcome flows, abandoned cart, and win-back sequences are where most stores are hiding their fastest revenue -- and they are invisible to any surface scan.`
    }
    case 'seo_geo_foundations': {
      const altPct = extractEv(ev, /Product image alt text \(catalog-wide\): (\d+)%/) ?? '0'
      return `SEO foundations. Your homepage tags are in place, but ${altPct}% of your product images have alt text -- search engines and AI tools are reading page structure but cannot interpret your actual products.`
    }
    case 'product_data_completeness': {
      const under50 = extractEv(ev, /Under 50 words: (\d+)%/)
      return `Product data. ${under50 ? `${under50}% of your products have descriptions under 50 words` : 'Product descriptions are thin'}, and 0% have image alt text. AI tools and search engines cannot accurately represent your range.`
    }
    case 'paid_traffic_tracking':
      return 'Tracking gaps. Major pixels are missing -- you are spending on traffic with no way to measure what converts, retarget visitors, or optimise campaigns.'
    case 'wholesale_readiness':
      return 'Wholesale infrastructure. B2B intent is visible on the homepage but there is no dedicated page for buyers to land on. A full wholesale channel is one page away.'
    default:
      return healthFinding(check)
  }
}

// ── Health Check email ─────────────────────────────────────────────────────────

export function buildHealthCheckEmail(firstName: string, result: ScoreResult): { html: string; text: string } {
  const { healthCheck: hc, surfaceReadNote } = result
  const score = hc.total
  const verdict = hc.verdict

  const biggestLeak = specificBiggestLeak(result.checks)

  const checksHtml = hc.checks.map(c => `
    <tr>
      <td width="96" style="width:96px;vertical-align:top;padding:14px 12px 14px 0;border-bottom:1px solid ${DIVIDER}">
        ${bandChip(c.band)}
      </td>
      <td style="vertical-align:top;padding:14px 0;border-bottom:1px solid ${DIVIDER}">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${CREAM};margin:0 0 4px;line-height:1.4">${htmlEscape(c.label)}</p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${CREAM_DIM};margin:0;line-height:1.6">${htmlEscape(healthFinding(c))}</p>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Shopify Health Check</title></head>
<body style="margin:0;padding:0;background-color:${DARK}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${DARK}">
  <tr><td align="center" style="padding:40px 16px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${DARK}">

    <!-- Gold top rule -->
    <tr><td style="background:linear-gradient(to right,${GOLD},${GOLD_LIGHT});height:3px;font-size:0;line-height:0">&nbsp;</td></tr>

    <!-- Header -->
    <tr><td style="padding:36px 40px 28px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 14px">AI BY AVANA</p>
      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;color:${CREAM};margin:0 0 8px;letter-spacing:-0.5px;line-height:1.15">Your Shopify Health Check</h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:42px;font-weight:900;color:${GOLD};margin:0 0 10px;letter-spacing:-1px;line-height:1">${score}<span style="font-size:22px;font-weight:400;color:${CREAM_DIM}">/100</span></p>
      ${scoreBar(score)}
      ${divSpacer(14)}
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:${CREAM};margin:0;letter-spacing:0.02em">${verdict}</p>
    </td></tr>

    ${dividerRow()}

    <!-- Personal note -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0 0 8px;line-height:1.8">Hi ${firstName},</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0;line-height:1.8">I ran your store through a ten-point health check. Here is what I found.</p>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- Biggest leak -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 10px">Biggest Leak</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:rgba(184,144,46,0.08);border-left:3px solid ${GOLD};padding:16px 20px">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM};margin:0;line-height:1.65;font-weight:500">${biggestLeak}</p>
      </td></tr></table>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- 10 checks -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 18px">The Ten Checks</p>
      <table width="100%" cellpadding="0" cellspacing="0">${checksHtml}</table>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- Surface read note -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM_DIM};margin:0;line-height:1.7;font-style:italic">${surfaceReadNote}</p>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- CTA -->
    ${spacerRow(28)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:${CREAM};margin:0 0 10px">Want the gaps fixed, not just named?</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0 0 20px;line-height:1.7">I offer a done-for-you audit that goes into the Shopify admin directly, checks the data your public site cannot expose, and gives you a prioritised fix list. Reply to this email to find out what that looks like for your store.</p>
      <table cellpadding="0" cellspacing="0"><tr><td style="background:${GOLD};padding:0"><a href="mailto:amanda@avanashowroom.com?subject=Audit follow-up for ${encodeURIComponent(result.storeUrl)}" style="display:block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#05050A;text-decoration:none">Reply to Talk</a></td></tr></table>
    </td></tr>
    ${spacerRow(36)}

    ${dividerRow()}

    <!-- Footer -->
    ${spacerRow(20)}
    <tr><td style="padding:0 40px 32px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM_DIM};margin:0 0 4px">Amanda Van As &nbsp;|&nbsp; AI by AVANA &nbsp;|&nbsp; avanashowroom.com</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(247,244,239,0.35);margin:0">You received this because you requested a health check for ${result.storeUrl}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  const text = [
    `YOUR SHOPIFY HEALTH CHECK`,
    `Score: ${score}/100 — ${verdict}`,
    ``,
    `Hi ${firstName},`,
    ``,
    `I ran your store through a ten-point health check. Here is what I found.`,
    ``,
    `BIGGEST LEAK`,
    biggestLeak,
    ``,
    `THE TEN CHECKS`,
    ...hc.checks.map(c => `[${c.band.toUpperCase()}] ${c.label}: ${c.evidence}`),
    ``,
    `NOTE`,
    surfaceReadNote,
    ``,
    `Want the gaps fixed, not just named? Reply to this email and I will tell you what a done-for-you audit looks like for your store.`,
    ``,
    `Amanda Van As | AI by AVANA | avanashowroom.com`,
  ].join('\n')

  return { html, text }
}

// ── AI Visibility email ────────────────────────────────────────────────────────

export function buildVisibilityEmail(firstName: string, result: ScoreResult): { html: string; text: string } {
  const { visibility, surfaceReadNote } = result
  const score = visibility.total
  const band = visibility.band
  const biggestLeak = specificBiggestLeak(result.checks)

  const dimsHtml = visibility.dimensions.map(d => `
    <tr>
      <td style="padding:18px 0;border-bottom:1px solid ${DIVIDER}">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:16px;white-space:nowrap">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:${GOLD};margin:0;line-height:1">${d.score}</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM_DIM};margin:2px 0 0">/20</p>
            </td>
            <td style="vertical-align:top;width:100%">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td><p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${CREAM};margin:0 0 6px">${d.label}</p></td>
                <td align="right">${bandChip(d.band)}</td>
              </tr></table>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${CREAM_DIM};margin:0;line-height:1.6">${d.explanation}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  const needsInputHtml = visibility.needsInput.map(n =>
    `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${CREAM_DIM};margin:0 0 6px;line-height:1.6;padding-left:12px">&#8226; ${n}</p>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your AI Visibility Score</title></head>
<body style="margin:0;padding:0;background-color:${DARK}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${DARK}">
  <tr><td align="center" style="padding:40px 16px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${DARK}">

    <!-- Gold top rule -->
    <tr><td style="background:linear-gradient(to right,${GOLD},${GOLD_LIGHT});height:3px;font-size:0;line-height:0">&nbsp;</td></tr>

    <!-- Header -->
    <tr><td style="padding:36px 40px 28px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 14px">AI BY AVANA</p>
      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;color:${CREAM};margin:0 0 8px;letter-spacing:-0.5px;line-height:1.15">Your AI Visibility Score</h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:42px;font-weight:900;color:${GOLD};margin:0 0 10px;letter-spacing:-1px;line-height:1">${score}<span style="font-size:22px;font-weight:400;color:${CREAM_DIM}">/100</span></p>
      ${scoreBar(score)}
      ${divSpacer(14)}
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:${CREAM};margin:0;letter-spacing:0.02em">${band}</p>
    </td></tr>

    ${dividerRow()}

    <!-- Personal note -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0 0 8px;line-height:1.8">Hi ${firstName},</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0;line-height:1.8">I scored your store across five dimensions of AI search visibility. Here is where you stand and where the gaps are.</p>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- Biggest leak -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 10px">Biggest Leak</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:rgba(184,144,46,0.08);border-left:3px solid ${GOLD};padding:16px 20px">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM};margin:0;line-height:1.65;font-weight:500">${biggestLeak}</p>
      </td></tr></table>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- 5 dimensions -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:0 0 6px">The Five Dimensions</p>
      <table width="100%" cellpadding="0" cellspacing="0">${dimsHtml}</table>
    </td></tr>
    ${spacerRow(24)}

    <!-- Needs input -->
    ${needsInputHtml ? `
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${CREAM_DIM};margin:0 0 8px">This score cannot include:</p>
      ${needsInputHtml}
    </td></tr>
    ${spacerRow(20)}` : ''}

    ${dividerRow()}

    <!-- Surface read note -->
    ${spacerRow(24)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM_DIM};margin:0;line-height:1.7;font-style:italic">${surfaceReadNote}</p>
    </td></tr>
    ${spacerRow(28)}

    ${dividerRow()}

    <!-- CTA -->
    ${spacerRow(28)}
    <tr><td style="padding:0 40px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:${CREAM};margin:0 0 10px">Want to know what AI search actually sees when it hits your store?</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${CREAM_DIM};margin:0 0 20px;line-height:1.7">I run a full AI discovery audit that goes beyond what any public scan can reach. It includes a review of your product data, structured content, and AI-readiness signals that only the admin side exposes. Reply to this email if you want to know what that finds.</p>
      <table cellpadding="0" cellspacing="0"><tr><td style="background:${GOLD};padding:0"><a href="mailto:amanda@avanashowroom.com?subject=AI Visibility follow-up for ${encodeURIComponent(result.storeUrl)}" style="display:block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#05050A;text-decoration:none">Reply to Talk</a></td></tr></table>
    </td></tr>
    ${spacerRow(36)}

    ${dividerRow()}

    <!-- Footer -->
    ${spacerRow(20)}
    <tr><td style="padding:0 40px 32px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM_DIM};margin:0 0 4px">Amanda Van As &nbsp;|&nbsp; AI by AVANA &nbsp;|&nbsp; avanashowroom.com</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(247,244,239,0.35);margin:0">You received this because you requested an AI visibility score for ${result.storeUrl}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  const text = [
    `YOUR AI VISIBILITY SCORE`,
    `Score: ${score}/100 — ${band}`,
    ``,
    `Hi ${firstName},`,
    ``,
    `I scored your store across five dimensions of AI search visibility. Here is what I found.`,
    ``,
    `BIGGEST LEAK`,
    biggestLeak,
    ``,
    `THE FIVE DIMENSIONS`,
    ...visibility.dimensions.map(d => `${d.label}: ${d.score}/20 (${d.band})\n  ${d.explanation}`),
    ``,
    ...(visibility.needsInput.length ? ['THIS SCORE CANNOT INCLUDE:', ...visibility.needsInput.map(n => `  - ${n}`), ''] : []),
    `NOTE`,
    surfaceReadNote,
    ``,
    `Want to know what AI search actually sees when it hits your store? Reply to this email.`,
    ``,
    `Amanda Van As | AI by AVANA | avanashowroom.com`,
  ].join('\n')

  return { html, text }
}

// ── Fallback alert to Amanda ──────────────────────────────────────────────────

async function sendFallbackAlert(firstName: string, email: string, storeUrl: string, err: unknown): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>',
    to: 'amanda@avanashowroom.com',
    replyTo: 'amanda@avanashowroom.com',
    subject: `SCORE RUN FAILED — ${email} / ${storeUrl}`,
    html: `<p style="font-family:Arial;font-size:16px">Score run failed for <strong>${firstName}</strong> (${email}), store: <strong>${storeUrl}</strong>.</p><p style="font-family:Arial;font-size:16px">Error: ${String(err)}</p><p style="font-family:Arial;font-size:16px">Run manually: <code>npx tsx src/lib/score-engine/run-test.ts ${storeUrl}</code> and send the report directly.</p>`,
    text: `Score run failed for ${firstName} (${email}), store: ${storeUrl}.\n\nError: ${String(err)}\n\nRun manually: npx tsx src/lib/score-engine/run-test.ts ${storeUrl}`,
  })
}

// ── Score status helper ───────────────────────────────────────────────────────

async function updateScoreStatus(
  email: string,
  storeUrl: string,
  type: string,
  status: 'sent' | 'failed',
): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    await admin
      .from('score_leads')
      .update({ score_status: status })
      .eq('email', email.toLowerCase())
      .eq('store_url', storeUrl)
      .eq('type', type)
  } catch (e) {
    console.error('[score-runner] updateScoreStatus failed (non-fatal):', e)
  }
}

// ── Background score runner ───────────────────────────────────────────────────

export async function runScoreAndEmail(payload: ScoreRunPayload): Promise<void> {
  const { firstName, email, storeUrl, type } = payload
  const apiKey = process.env.RESEND_API_KEY

  let result: ScoreResult

  try {
    console.log(`[score-runner] Starting score run for ${storeUrl} (${type})`)
    result = await runScore(storeUrl)
    console.log(`[score-runner] Score complete: ${storeUrl} — health ${result.healthCheck.total}/100`)
  } catch (err) {
    console.error('[score-runner] runScore failed:', err)
    await updateScoreStatus(email, storeUrl, type, 'failed')
    try {
      await sendFallbackAlert(firstName, email, storeUrl, err)
    } catch (alertErr) {
      console.error('[score-runner] fallback alert also failed:', alertErr)
    }
    return
  }

  if (!apiKey) {
    console.warn('[score-runner] RESEND_API_KEY not set — cannot email report')
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { html, text } = type === 'shopify_health'
    ? buildHealthCheckEmail(firstName, result)
    : buildVisibilityEmail(firstName, result)

  const scoreLabel = type === 'shopify_health'
    ? `${result.healthCheck.total}/100`
    : `${result.visibility.total}/100`

  const subject = type === 'shopify_health'
    ? `Your Shopify Health Check: ${scoreLabel} — ${result.healthCheck.verdict}`
    : `Your AI Visibility Score: ${scoreLabel} — ${result.visibility.band}`

  try {
    const { error } = await resend.emails.send({
      from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>',
      to: email,
      replyTo: 'amanda@avanashowroom.com',
      subject,
      html,
      text,
    })
    if (error) {
      console.error('[score-runner] Resend failed sending to submitter:', error)
      await updateScoreStatus(email, storeUrl, type, 'failed')
      await sendFallbackAlert(firstName, email, storeUrl, `Resend error: ${JSON.stringify(error)}`)
    } else {
      console.log(`[score-runner] Report emailed to ${email}`)
      await updateScoreStatus(email, storeUrl, type, 'sent')
    }
  } catch (err) {
    console.error('[score-runner] Unexpected send error:', err)
    await updateScoreStatus(email, storeUrl, type, 'failed')
    await sendFallbackAlert(firstName, email, storeUrl, err)
  }
}

// ── Server function ───────────────────────────────────────────────────────────
//
// Uses ctx.waitUntil() to keep the Cloudflare Worker alive until the score run
// completes. On Cloudflare Pages, Nitro's cloudflare-pages preset calls augmentReq()
// which binds waitUntil directly onto the Request object as req.waitUntil.
// getRequest() from @tanstack/react-start/server returns that augmented object.
//
// Branch logging confirms which path runs in production — check Cloudflare deploy
// logs after first deploy to verify "cloudflare-ctx" (not "fallback-no-ctx") appears.
// If fallback is logged, move to Cloudflare Queues (Option B).
//
// Dev (Node.js): req.waitUntil is undefined → falls through to fire-and-forget,
// which is correct since the Node process stays alive for the full run.

export const kickScoreRun = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const schema = z.object({
      firstName: z.string().min(1).max(120),
      email: z.string().email().max(254),
      storeUrl: z.string().min(1).max(500),
      type: z.enum(['ai_visibility', 'shopify_health']),
    })
    return schema.parse(raw)
  })
  .handler(async ({ data }) => {
    // Resolve the Cloudflare ExecutionContext waitUntil bound to the request by
    // Nitro's augmentReq(). Undefined on Node dev server — falls through to
    // fire-and-forget, which is fine since the process doesn't terminate.
    let cfWaitUntil: ((p: Promise<unknown>) => void) | undefined
    try {
      const { getRequest } = await import('@tanstack/react-start/server')
      const req = getRequest() as Request & { waitUntil?: (p: Promise<unknown>) => void }
      cfWaitUntil = req.waitUntil?.bind(req)
    } catch {
      // Outside a server request context — safe to ignore
    }

    const task = runScoreAndEmail(data).catch(err => {
      console.error('[score-runner] Background task error (uncaught):', err)
    })

    if (cfWaitUntil) {
      console.log('[score-runner] waitUntil path: cloudflare-ctx — Worker will stay alive for score run')
      cfWaitUntil(task)
    } else {
      console.log('[score-runner] waitUntil path: fallback-no-ctx — fire-and-forget (dev or ctx unavailable)')
    }

    return { started: true }
  })
