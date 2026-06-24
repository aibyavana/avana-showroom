import { CheckResult, BAND_SCORES } from '../rubric'
import { fetchText, fetchSitemapData } from '../crawl'
import type { CatalogAnalysis } from '../catalog'

const DUPLICATE_SIGNALS = ['all', 'all-products', 'frontpage', 'undefined', 'test', 'sample']

export async function checkCatalogStructure(baseUrl: string, catalog?: CatalogAnalysis): Promise<CheckResult> {
  const evidence: string[] = []

  const { collectionUrls } = await fetchSitemapData(baseUrl, 100)
  evidence.push(`Collections found in sitemap: ${collectionUrls.length}`)

  const slugs = collectionUrls.map(u => u.split('/collections/')[1]?.split('?')[0] || '')
  const flagged = slugs.filter(s => DUPLICATE_SIGNALS.includes(s.toLowerCase()))
  if (flagged.length > 0) {
    evidence.push(`Generic/default collections exposed: ${flagged.join(', ')}`)
  } else if (collectionUrls.length > 0) {
    evidence.push('No obvious default/generic collection names found')
  }

  // Sample a non-generic collection page to check filter presence
  const sampleUrl = collectionUrls.find(u => !flagged.some(f => u.includes(f))) || collectionUrls[0]
  if (sampleUrl) {
    const html = await fetchText(sampleUrl)
    if (html) {
      const hasFilters = /filter|refine|sort-by|sort_by/i.test(html)
      evidence.push(`Filter/sort UI: ${hasFilters ? 'detected' : 'not detected'} on sampled collection`)
    }
  }

  // Tag quality from catalog JSON
  if (catalog && !catalog.blocked && catalog.totalSampled > 0) {
    evidence.push(`Avg tags per product: ${catalog.avgTagsPerProduct}`)
    evidence.push(`Unique tags across catalog: ${catalog.totalUniqueTags}`)
    if (catalog.systemTagRatio > 0.2) {
      evidence.push(`High system-tag ratio (${Math.round(catalog.systemTagRatio * 100)}%) — cleanup may improve tag-based discovery`)
    }
  }

  let band: 'pass' | 'partial' | 'fail'
  if (collectionUrls.length >= 5 && flagged.length === 0) {
    band = 'pass'
  } else if (collectionUrls.length >= 2) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'catalog_structure',
    label: 'Catalog Structure & Tagging',
    band,
    score: BAND_SCORES[band],
    evidence: `Directional read from public sitemap + catalog JSON | ${evidence.join(' | ')}`,
  }
}
