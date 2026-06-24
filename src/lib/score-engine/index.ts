import { CheckResult, BAND_SCORES, VISIBILITY_DIMENSIONS, healthVerdict, visibilityBand } from './rubric'
import { fetchText, normaliseUrl, extractBrandText } from './crawl'
import { fetchCatalogData } from './catalog'
import { checkAiSearchVisibility } from './checks/ai-search-visibility'
import { checkSeoGeoFoundations } from './checks/seo-geo-foundations'
import { checkProductDataCompleteness } from './checks/product-data-completeness'
import { checkCatalogStructure } from './checks/catalog-structure'
import { checkEmailRetention } from './checks/email-retention'
import { checkCheckoutConversion } from './checks/checkout-conversion'
import { checkPaidTrafficTracking } from './checks/paid-traffic-tracking'
import { checkWholesaleReadiness } from './checks/wholesale-readiness'
import { checkMobilePerformance } from './checks/mobile-performance'
import { checkBrandContentConsistency } from './judgment'

export interface HealthCheckScore {
  total: number
  verdict: string
  checks: CheckResult[]
}

export interface VisibilityDimension {
  id: string
  label: string
  score: number
  band: string
  explanation: string
}

export interface VisibilityScore {
  total: number
  band: string
  biggestLeak: string
  dimensions: VisibilityDimension[]
  needsInput: string[]
}

export interface ScoreResult {
  storeUrl: string
  ranAt: string
  durationMs: number
  checks: CheckResult[]
  healthCheck: HealthCheckScore
  visibility: VisibilityScore
  surfaceReadNote: string
}

// ── Dimension explanation generator ──────────────────────────────────────────

function explainDimension(dimId: string, score: number, checks: CheckResult[]): string {
  const getCheck = (id: string) => checks.find(c => c.id === id)

  switch (dimId) {
    case 'findability': {
      const ai = getCheck('ai_search_visibility')
      const seo = getCheck('seo_geo_foundations')
      if (score >= 16) return `AI crawlers can index this store and core SEO signals are in place. The store is visible to both traditional and AI-driven search.`
      if (ai?.band === 'fail') return `AI search crawlers are blocked or have no guidance (no llms.txt). AI tools like ChatGPT Shopping and Perplexity cannot surface this store regardless of how strong the products are.`
      if (seo?.band === 'fail') return `Basic SEO foundations are missing on key pages. Without title tags, meta descriptions, and structured data, this store is difficult for any search engine to read accurately.`
      return `Partial findability signals in place, but gaps in either AI crawler access or core SEO structure are limiting reach.`
    }
    case 'discoverability': {
      const prod = getCheck('product_data_completeness')
      if (score >= 16) return `Strong structured data and SEO foundations across pages. This store gives search engines and AI tools accurate, rich product signals.`
      if (prod?.band === 'fail') return `Product pages lack descriptions and structured data. AI tools and search engines cannot accurately represent the products — shoppers searching for specific items will not find them.`
      return `Some SEO foundations are in place, but product-level data completeness is limiting how accurately this store gets surfaced in search and AI results.`
    }
    case 'data_readiness': {
      const prod = getCheck('product_data_completeness')
      const cat = getCheck('catalog_structure')
      if (score >= 16 && prod?.band === 'pass') return `Product data is well-structured with strong descriptions and image alt text. The catalog is clearly organised for both human and machine reading.`
      if (prod?.band === 'fail' && cat?.band === 'fail') return `Product data is thin and the catalog structure shows signs of default or generic organisation. This limits both AI interpretation and buyer experience.`
      if (prod?.band === 'partial') return `Catalog structure is organised but product data has gaps — missing image alt text or thin descriptions limit how accurately AI tools and search engines can interpret the range.`
      return `Product data or catalog structure has gaps that make it harder for AI tools, buyers, and search engines to accurately navigate the range.`
    }
    case 'automation_potential': {
      const email = getCheck('email_retention')
      if (score >= 16) return `Email capture, an ESP, and paid tracking pixels are in place. The automation foundation exists to run retention and paid acquisition efficiently.`
      if (email?.band === 'fail') return `No email capture or ESP detected. Every visitor who leaves with no purchase and no email is permanently lost — there is no retention mechanism in place.`
      return `Some automation signals are present but the stack is incomplete or unverifiable from the outside. Revenue is likely being left on the table through gaps in email flows or paid channel setup.`
    }
    case 'channel_sprawl': {
      const wholesale = getCheck('wholesale_readiness')
      if (score >= 16) return `Multi-channel tracking is in place and B2B/wholesale infrastructure is visible. The brand is operating across channels with the infrastructure to manage them.`
      if (wholesale?.band === 'fail') return `No wholesale or B2B infrastructure is visible. For a brand at growth stage, missing this channel means leaving a significant revenue stream untouched.`
      return `Channel setup is partial — either paid tracking or B2B infrastructure has gaps that are limiting the brand's full revenue potential.`
    }
    default:
      return `Score: ${score}/20 (${visibilityBand(score * 5)}).`
  }
}

function findBiggestLeak(checks: CheckResult[]): string {
  const fails = checks.filter(c => c.band === 'fail')
  const partials = checks.filter(c => c.band === 'partial')

  const priority: Record<string, string> = {
    ai_search_visibility:      'AI crawlers are blocked or have no guidance — this store is invisible to AI-powered search.',
    email_retention:           'No email capture or ESP detected — every non-converting visitor is permanently lost.',
    seo_geo_foundations:       'Core SEO signals are missing on key pages — the store is underreadable by search engines.',
    product_data_completeness: 'Product descriptions and image alt text are thin — AI tools cannot accurately represent the range.',
    mobile_performance:        'Mobile performance is poor — the majority of traffic is hitting a slow experience.',
    paid_traffic_tracking:     'No tracking pixels detected — paid spend cannot be measured or optimised.',
    wholesale_readiness:       'No B2B or wholesale infrastructure visible — a major revenue channel is untapped.',
    catalog_structure:         'Catalog structure has gaps — buyer navigation and search indexing are both impacted.',
    checkout_conversion:       'Checkout or accelerated payment options need attention.',
    brand_content_consistency: 'Brand voice and content coherence need work.',
  }

  for (const id of Object.keys(priority)) {
    if (fails.some(c => c.id === id)) return priority[id]
  }
  for (const id of Object.keys(priority)) {
    if (partials.some(c => c.id === id)) return priority[id].replace(/—.*/, '— partially addressed but not complete.')
  }

  return 'No critical leaks detected — focus on incremental improvements across all dimensions.'
}

// ── Scorers ───────────────────────────────────────────────────────────────────

export function scoreHealthCheck(checks: CheckResult[]): HealthCheckScore {
  // Max possible: 10 checks x 9 points = 90. Scale to /100.
  const raw = checks.reduce((s, c) => s + c.score, 0)
  const total = Math.round((raw / 90) * 100)
  return { total, verdict: healthVerdict(total), checks }
}

export function scoreVisibility(checks: CheckResult[]): VisibilityScore {
  const checkMap = Object.fromEntries(checks.map(c => [c.id, c]))

  const dimensions: VisibilityDimension[] = VISIBILITY_DIMENSIONS.map(dim => {
    const dimChecks = dim.checkIds.map(id => checkMap[id]).filter(Boolean)
    const raw = dimChecks.reduce((s, c) => s + c.score, 0)
    const maxRaw = dimChecks.length * 9
    const dimScore = maxRaw > 0 ? Math.round((raw / maxRaw) * 20) : 0
    const explanation = explainDimension(dim.id, dimScore, checks)

    return {
      id: dim.id,
      label: dim.label,
      score: dimScore,
      band: visibilityBand(dimScore * 5),
      explanation,
    }
  })

  const total = dimensions.reduce((s, d) => s + d.score, 0)

  return {
    total,
    band: visibilityBand(total),
    biggestLeak: findBiggestLeak(checks),
    dimensions,
    needsInput: [
      'Email automation depth (active flows, open rates, list health) — requires brand self-report or ESP access',
      'Paid channel ROAS and conversion rate — requires analytics access',
      'Shopify SEO meta title/description coverage — requires admin API or manual audit',
    ],
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runScore(rawUrl: string): Promise<ScoreResult> {
  const start = Date.now()
  const storeUrl = normaliseUrl(rawUrl)

  // Fetch homepage and catalog concurrently — both shared across multiple checks
  const [homepageHtml, catalog] = await Promise.all([
    fetchText(storeUrl).then(h => h ?? ''),
    fetchCatalogData(storeUrl, 2),
  ])

  if (!homepageHtml) {
    console.warn(`[score-engine] Could not fetch homepage for ${storeUrl}`)
  }

  const brandText = extractBrandText(homepageHtml)

  // Run all checks concurrently
  const [
    aiVisibility,
    seoGeo,
    productData,
    catalogStructure,
    emailRetention,
    checkoutConv,
    paidTracking,
    wholesale,
    mobilePerf,
    brandJudgment,
  ] = await Promise.all([
    checkAiSearchVisibility(storeUrl, catalog),
    checkSeoGeoFoundations(storeUrl, homepageHtml, catalog),
    checkProductDataCompleteness(catalog),
    checkCatalogStructure(storeUrl, catalog),
    checkEmailRetention(homepageHtml),
    checkCheckoutConversion(storeUrl, homepageHtml),
    checkPaidTrafficTracking(homepageHtml),
    checkWholesaleReadiness(storeUrl, homepageHtml),
    checkMobilePerformance(storeUrl),
    checkBrandContentConsistency({ brandText, storeUrl }),
  ])

  const checks: CheckResult[] = [
    aiVisibility, seoGeo, productData, catalogStructure,
    emailRetention, checkoutConv, paidTracking, wholesale,
    mobilePerf, brandJudgment,
  ]

  const catalogNote = catalog.blocked
    ? 'Product catalog (/products.json) was not accessible — product data checks are directional only.'
    : `Product catalog read: ${catalog.totalSampled} products sampled.`

  const surfaceReadNote = [
    'This score reflects what is readable from public pages and the Shopify catalog endpoint.',
    catalogNote,
    'What this engine cannot access: Shopify admin SEO meta fields (separate from product descriptions), email automation depth and flow count, paid channel ROAS, and cart abandonment / conversion rate data.',
    'The paid audit reads these directly — gaps that look partial here may be critical under a full review.',
  ].join(' ')

  return {
    storeUrl,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    checks,
    healthCheck: scoreHealthCheck(checks),
    visibility: scoreVisibility(checks),
    surfaceReadNote,
  }
}
