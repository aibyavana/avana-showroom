import { wordCount } from './crawl'

export interface CatalogAnalysis {
  blocked: boolean
  totalSampled: number
  avgDescriptionWords: number
  pctUnder50Words: number
  pctEmptyDescription: number
  pctWithMeaningfulAlt: number
  totalUniqueTags: number
  avgTagsPerProduct: number
  systemTagRatio: number // fraction of tags that are system (__label: etc.)
}

const EMPTY_CATALOG: CatalogAnalysis = {
  blocked: true,
  totalSampled: 0,
  avgDescriptionWords: 0,
  pctUnder50Words: 100,
  pctEmptyDescription: 100,
  pctWithMeaningfulAlt: 0,
  totalUniqueTags: 0,
  avgTagsPerProduct: 0,
  systemTagRatio: 0,
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

interface ShopifyProduct {
  id: number
  title: string
  body_html: string | null
  images: Array<{ alt: string | null }>
  tags: string[]
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[]
}

export async function fetchCatalogData(baseUrl: string, maxPages = 2): Promise<CatalogAnalysis> {
  const products: ShopifyProduct[] = []

  try {
    for (let page = 1; page <= maxPages; page++) {
      const url = `${baseUrl}/products.json?limit=250&page=${page}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AVANA-Audit/1.0)' },
        signal: AbortSignal.timeout(15_000),
      })

      if (res.status === 401 || res.status === 403) {
        // Store has locked down the endpoint
        return { ...EMPTY_CATALOG, blocked: true }
      }
      if (!res.ok) break

      const json = (await res.json()) as ShopifyProductsResponse
      if (!Array.isArray(json.products) || json.products.length === 0) break

      products.push(...json.products)
      if (json.products.length < 250) break // last page
    }
  } catch {
    // Timeout or network error — treat as blocked
    return { ...EMPTY_CATALOG, blocked: true }
  }

  if (products.length === 0) return EMPTY_CATALOG

  let totalWords = 0
  let under50 = 0
  let emptyDesc = 0
  let withMeaningfulAlt = 0
  const allTags: string[] = []
  let systemTagCount = 0

  for (const p of products) {
    const text = stripHtml(p.body_html ?? '')
    const wc = wordCount(text)
    totalWords += wc
    if (wc === 0) emptyDesc++
    if (wc < 50) under50++

    const alts = (p.images ?? []).map(i => i.alt)
    const hasMeaningfulAlt = alts.some(a => a && a.trim().length > 3)
    if (hasMeaningfulAlt) withMeaningfulAlt++

    for (const tag of p.tags ?? []) {
      allTags.push(tag)
      if (tag.startsWith('__')) systemTagCount++
    }
  }

  const n = products.length
  const uniqueTags = new Set(allTags).size

  return {
    blocked: false,
    totalSampled: n,
    avgDescriptionWords: Math.round(totalWords / n),
    pctUnder50Words: Math.round((under50 / n) * 100),
    pctEmptyDescription: Math.round((emptyDesc / n) * 100),
    pctWithMeaningfulAlt: Math.round((withMeaningfulAlt / n) * 100),
    totalUniqueTags: uniqueTags,
    avgTagsPerProduct: Math.round((allTags.length / n) * 10) / 10,
    systemTagRatio: allTags.length > 0 ? Math.round((systemTagCount / allTags.length) * 100) / 100 : 0,
  }
}
