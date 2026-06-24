import { CheckResult, BAND_SCORES } from '../rubric'
import { fetchText } from '../crawl'

const WHOLESALE_PATTERNS = [
  /wholesale/i,
  /stockist/i,
  /trade\s+account/i,
  /\btrade\b.*\bportal\b/i,
  /retailer/i,
  /b2b/i,
]

const B2B_PLATFORMS = [
  { name: 'Faire',      pattern: /faire\.com/i },
  { name: 'JOOR',       pattern: /joor\.com/i },
  { name: 'Brandboom',  pattern: /brandboom\.com/i },
  { name: 'NuOrder',    pattern: /nuorder\.com/i },
  { name: 'Tundra',     pattern: /tundra\.com/i },
  { name: 'Shopify B2B', pattern: /shopify.*b2b|b2b.*shopify/i },
]

export async function checkWholesaleReadiness(baseUrl: string, homepageHtml: string): Promise<CheckResult> {
  const evidence: string[] = []

  // Check homepage for wholesale signals
  const homepageWholesale = WHOLESALE_PATTERNS.some(p => p.test(homepageHtml))
  const platformsOnHomepage = B2B_PLATFORMS.filter(p => p.pattern.test(homepageHtml)).map(p => p.name)

  // Try common wholesale page URLs
  const wholesaleUrls = [
    `${baseUrl}/pages/wholesale`,
    `${baseUrl}/pages/trade`,
    `${baseUrl}/pages/stockists`,
    `${baseUrl}/pages/retailers`,
    `${baseUrl}/wholesale`,
  ]
  const pageChecks = await Promise.all(wholesaleUrls.map(u => fetchText(u)))
  const foundPage = wholesaleUrls.find((_, i) => pageChecks[i] && (pageChecks[i]?.length ?? 0) > 500)

  if (foundPage) {
    evidence.push(`Wholesale page found: ${foundPage.replace(baseUrl, '')}`)
    const pageHtml = pageChecks[wholesaleUrls.indexOf(foundPage)]!
    const platformsOnPage = B2B_PLATFORMS.filter(p => p.pattern.test(pageHtml)).map(p => p.name)
    if (platformsOnPage.length) evidence.push(`B2B platform links: ${platformsOnPage.join(', ')}`)
  } else if (homepageWholesale) {
    evidence.push('Wholesale mention on homepage but no dedicated page found at common URLs')
  } else {
    evidence.push('No wholesale page or mention found')
  }

  if (platformsOnHomepage.length) evidence.push(`B2B platforms on homepage: ${platformsOnHomepage.join(', ')}`)

  let band: 'pass' | 'partial' | 'fail'
  if (foundPage) {
    band = 'pass'
  } else if (homepageWholesale || platformsOnHomepage.length > 0) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'wholesale_readiness',
    label: 'Wholesale Readiness',
    band,
    score: BAND_SCORES[band],
    evidence: evidence.join(' | '),
  }
}
