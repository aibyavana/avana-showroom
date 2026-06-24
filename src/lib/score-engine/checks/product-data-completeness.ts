import { CheckResult, BAND_SCORES } from '../rubric'
import type { CatalogAnalysis } from '../catalog'

export async function checkProductDataCompleteness(catalog: CatalogAnalysis): Promise<CheckResult> {
  if (catalog.blocked) {
    return {
      id: 'product_data_completeness',
      label: 'Product Data Completeness',
      band: 'partial',
      score: BAND_SCORES.partial,
      evidence: 'products.json blocked or unreachable — cannot assess catalog data quality',
    }
  }

  const evidence: string[] = [
    `${catalog.totalSampled} products sampled from /products.json`,
    `Avg description: ${catalog.avgDescriptionWords} words`,
    `Under 50 words: ${catalog.pctUnder50Words}%`,
    `Image alt text: ${catalog.pctWithMeaningfulAlt}% of products have at least one meaningful alt`,
    'Note: Shopify SEO meta title/description fields are separate from product descriptions and not readable via public API',
  ]

  // Decision logic — conservative
  // Alt text at 0% is a real gap for both AI indexing and accessibility
  const altGap = catalog.pctWithMeaningfulAlt < 30
  const descThin = catalog.avgDescriptionWords < 30 || catalog.pctUnder50Words > 60
  const descMissing = catalog.pctEmptyDescription > 40

  let band: 'pass' | 'partial' | 'fail'

  if (descMissing || (descThin && altGap)) {
    band = 'fail'
  } else if (altGap || catalog.pctUnder50Words > 30) {
    // Good descriptions but alt text missing = partial at best
    // (alt text is an AI-readability and SEO signal — can't confirm clean without it)
    band = 'partial'
    if (altGap) evidence.push('Alt text gap: AI tools and screen readers cannot interpret product images')
  } else if (catalog.avgDescriptionWords >= 60 && catalog.pctWithMeaningfulAlt >= 70) {
    band = 'pass'
  } else {
    band = 'partial'
  }

  return {
    id: 'product_data_completeness',
    label: 'Product Data Completeness',
    band,
    score: BAND_SCORES[band],
    evidence: evidence.join(' | '),
  }
}
