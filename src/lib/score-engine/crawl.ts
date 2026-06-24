// Crawl utilities — fetch public storefront pages with timeouts.
// Never throws; returns null on failure.

const UA = 'Mozilla/5.0 (compatible; AVANAScoreBot/1.0; +https://avanashowroom.com)'
const TIMEOUT_MS = 10_000

async function fetchWithTimeout(url: string, ms = TIMEOUT_MS): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      redirect: 'follow',
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchText(url: string): Promise<string | null> {
  const res = await fetchWithTimeout(url)
  if (!res || !res.ok) return null
  try { return await res.text() } catch { return null }
}

export function normaliseUrl(raw: string): string {
  const u = raw.trim().replace(/\/$/, '')
  return u.startsWith('http') ? u : `https://${u}`
}

// Parse up to `limit` product/collection URLs from a flat sitemap.
export function extractSitemapUrls(xml: string, limit = 10): string[] {
  const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
  return matches
    .map(m => m[1])
    .filter(u => u.includes('/products/') || u.includes('/collections/'))
    .slice(0, limit)
}

// Detect whether an XML string is a sitemap index (vs a flat sitemap).
export function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml)
}

// Extract child sitemap URLs from a sitemap index.
export function extractChildSitemapUrls(xml: string): string[] {
  const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
  return matches.map(m => m[1])
}

// Check if a URL looks like an agentic/AI discovery sitemap.
export function isAgenticSitemap(url: string): boolean {
  return /agentic|llm|ai.?discovery/i.test(url)
}

// Smart sitemap fetcher: handles flat sitemaps AND sitemap indexes.
// Returns { productUrls, collectionUrls, hasAgenticSitemap }
export async function fetchSitemapData(baseUrl: string, limit = 10): Promise<{
  productUrls: string[]
  collectionUrls: string[]
  hasAgenticSitemap: boolean
}> {
  const xml = await fetchText(`${baseUrl}/sitemap.xml`)
  if (!xml) return { productUrls: [], collectionUrls: [], hasAgenticSitemap: false }

  // Flat sitemap — extract directly
  if (!isSitemapIndex(xml)) {
    const all = extractSitemapUrls(xml, limit * 2)
    return {
      productUrls: all.filter(u => u.includes('/products/')).slice(0, limit),
      collectionUrls: all.filter(u => u.includes('/collections/')).slice(0, limit),
      hasAgenticSitemap: false,
    }
  }

  // Sitemap index — find relevant child sitemaps and fetch them
  const childUrls = extractChildSitemapUrls(xml)
  const hasAgenticSitemap = childUrls.some(isAgenticSitemap)

  // Find the first English-locale product and collection child sitemaps
  // (skip /ru/, /fr/, etc. locale prefixes)
  const productSitemapUrl = childUrls.find(u => /sitemap_products/.test(u) && !/\/[a-z]{2}\/sitemap/.test(u))
  const collectionSitemapUrl = childUrls.find(u => /sitemap_collections/.test(u) && !/\/[a-z]{2}\/sitemap/.test(u))

  const [productXml, collectionXml] = await Promise.all([
    productSitemapUrl ? fetchText(productSitemapUrl) : Promise.resolve(null),
    collectionSitemapUrl ? fetchText(collectionSitemapUrl) : Promise.resolve(null),
  ])

  const productUrls = productXml
    ? [...productXml.matchAll(/<loc>(https?:\/\/[^<]+\/products\/[^<]+)<\/loc>/g)]
        .map(m => m[1]).filter(u => !/\/[a-z]{2}\/products/.test(u)).slice(0, limit)
    : []

  const collectionUrls = collectionXml
    ? [...collectionXml.matchAll(/<loc>(https?:\/\/[^<]+\/collections\/[^<]+)<\/loc>/g)]
        .map(m => m[1]).filter(u => !/\/[a-z]{2}\/collections/.test(u)).slice(0, limit)
    : []

  return { productUrls, collectionUrls, hasAgenticSitemap }
}

// Pull meta tag content
export function metaContent(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'))
  return m ? m[1] : null
}

export function hasTag(html: string, tag: string): boolean {
  return new RegExp(`<${tag}[\\s>]`, 'i').test(html)
}

export function hasText(html: string, ...fragments: string[]): boolean {
  const lower = html.toLowerCase()
  return fragments.some(f => lower.includes(f.toLowerCase()))
}

// Extract visible text from hero / above-fold area (first ~8KB)
export function extractBrandText(html: string): string {
  // Skip past <head> — Shopify pages front-load font-face, preload links, and meta
  // that consume the first 8000+ chars before any visible copy appears
  const bodyStart = html.search(/<body[\s>]/i)
  const startAt = bodyStart > 0 ? bodyStart : 0
  const slice = html.slice(startAt, startAt + 12000)

  return slice
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)
}

// Count words in a string
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
