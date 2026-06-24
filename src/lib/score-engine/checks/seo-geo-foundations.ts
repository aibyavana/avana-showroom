import { CheckResult, BAND_SCORES } from '../rubric'
import { fetchText, metaContent, fetchSitemapData } from '../crawl'
import type { CatalogAnalysis } from '../catalog'

export async function checkSeoGeoFoundations(
  baseUrl: string,
  homepageHtml: string,
  catalog?: CatalogAnalysis,
): Promise<CheckResult> {
  const evidence: string[] = []
  let signals = 0
  const total = 5

  // 1. Title tag
  const hasTitle = /<title[^>]*>[^<]{5,}<\/title>/i.test(homepageHtml)
  if (hasTitle) signals++
  evidence.push(`title tag: ${hasTitle ? 'present' : 'missing'}`)

  // 2. Meta description
  const desc = metaContent(homepageHtml, 'description')
  if (desc && desc.length >= 50) signals++
  evidence.push(`meta description: ${desc ? `${desc.length} chars` : 'missing'}`)

  // 3. Open Graph
  const ogTitle = metaContent(homepageHtml, 'og:title')
  if (ogTitle) signals++
  evidence.push(`Open Graph: ${ogTitle ? 'present' : 'missing'}`)

  // 4. Canonical
  const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]+>/i.test(homepageHtml)
  if (hasCanonical) signals++
  evidence.push(`canonical: ${hasCanonical ? 'present' : 'missing'}`)

  // 5. JSON-LD structured data
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(homepageHtml)
  if (hasJsonLd) signals++
  evidence.push(`JSON-LD: ${hasJsonLd ? 'present' : 'missing'}`)

  // Sample a product page from sitemap for product schema
  const { productUrls } = await fetchSitemapData(baseUrl, 3)
  if (productUrls.length > 0) {
    const productHtml = await fetchText(productUrls[0])
    if (productHtml) {
      const hasProductSchema = productHtml.includes('"@type":"Product"') || productHtml.includes('"@type": "Product"')
      evidence.push(`Product schema on sampled product page: ${hasProductSchema ? 'present' : 'missing'}`)
    }
  }

  // Catalog-wide alt text gap: affects SEO + AI image indexing across all product pages
  if (catalog && !catalog.blocked && catalog.totalSampled > 0) {
    evidence.push(`Product image alt text (catalog-wide): ${catalog.pctWithMeaningfulAlt}% have meaningful alt`)
    if (catalog.pctWithMeaningfulAlt < 30) {
      evidence.push('Image alt gap: product images not described — search engines and AI tools cannot read them')
    }
  }

  const homepageRatio = signals / total

  // Conservative band: homepage signals alone can reach partial.
  // Pass requires clean homepage AND no alt text gap at catalog level.
  let band: 'pass' | 'partial' | 'fail'
  const catalogAltGap = catalog && !catalog.blocked && catalog.pctWithMeaningfulAlt < 30

  if (homepageRatio >= 0.8 && !catalogAltGap) {
    band = 'pass'
  } else if (homepageRatio >= 0.8 && catalogAltGap) {
    // Good homepage but broken catalog-level signals = partial, not pass
    band = 'partial'
  } else if (homepageRatio >= 0.5) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'seo_geo_foundations',
    label: 'SEO & GEO Foundations',
    band,
    score: BAND_SCORES[band],
    evidence: `${signals}/${total} homepage signals present | ${evidence.join(' | ')}`,
  }
}
