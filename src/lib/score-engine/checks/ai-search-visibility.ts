import { CheckResult, BAND_SCORES } from '../rubric'
import { fetchText, fetchSitemapData } from '../crawl'
import type { CatalogAnalysis } from '../catalog'

const AI_CRAWLERS = [
  { name: 'GPTBot',          pattern: /GPTBot/i },
  { name: 'ChatGPT-User',    pattern: /ChatGPT-User/i },
  { name: 'PerplexityBot',   pattern: /PerplexityBot/i },
  { name: 'Claude-Web',      pattern: /Claude-Web|anthropic-ai/i },
  { name: 'Google-Extended',  pattern: /Google-Extended/i },
]

export async function checkAiSearchVisibility(
  baseUrl: string,
  catalog?: CatalogAnalysis,
): Promise<CheckResult> {
  const [robotsTxt, llmsTxt, sitemapData] = await Promise.all([
    fetchText(`${baseUrl}/robots.txt`),
    fetchText(`${baseUrl}/llms.txt`),
    fetchSitemapData(baseUrl, 1),
  ])

  const llmsPresent = !!llmsTxt && llmsTxt.trim().length > 20
  const hasAgenticSitemap = sitemapData.hasAgenticSitemap
  const evidence: string[] = []

  evidence.push(`llms.txt: ${llmsPresent ? 'present' : 'not found'}`)
  if (hasAgenticSitemap) evidence.push('Agentic discovery sitemap: present')

  let blockedCount = 0
  if (robotsTxt) {
    const lines = robotsTxt.split('\n').map(l => l.trim())
    let activeAgent: string | null = null
    const blocked: string[] = []
    const allowed: string[] = []

    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        activeAgent = line.slice(11).trim()
      } else if (line.toLowerCase().startsWith('disallow:') && activeAgent) {
        const path = line.slice(9).trim()
        const match = AI_CRAWLERS.find(c => c.pattern.test(activeAgent!))
        if (match && (path === '/' || path === '*')) {
          blocked.push(match.name)
          blockedCount++
        }
      } else if (line.toLowerCase().startsWith('allow:') && activeAgent) {
        const path = line.slice(6).trim()
        const match = AI_CRAWLERS.find(c => c.pattern.test(activeAgent!))
        if (match && (path === '/' || path === '*')) {
          allowed.push(match.name)
        }
      }
    }

    if (blocked.length) evidence.push(`AI crawlers blocked: ${blocked.join(', ')}`)
    if (allowed.length) evidence.push(`AI crawlers explicitly allowed: ${allowed.join(', ')}`)
    if (!blocked.length && !allowed.length) evidence.push('No AI-specific crawler rules in robots.txt')
  } else {
    evidence.push('robots.txt: unreadable')
  }

  // Catalog readability: alt text gap means AI tools can't interpret product images
  if (catalog && !catalog.blocked && catalog.totalSampled > 0 && catalog.pctWithMeaningfulAlt < 30) {
    evidence.push(`Product image alt text: ${catalog.pctWithMeaningfulAlt}% — AI tools cannot interpret product images`)
  }

  // Conservative scoring:
  // pass = llms.txt present AND no AI crawlers blocked (AI infrastructure is intentionally in place)
  // partial = crawlers not blocked but no explicit AI-readiness signals (passive — not deliberately optimised)
  // fail = one or more AI crawlers blocked AND no llms.txt
  let band: 'pass' | 'partial' | 'fail'

  if (llmsPresent && blockedCount === 0) {
    band = 'pass'
  } else if (blockedCount >= 3 && !llmsPresent && !hasAgenticSitemap) {
    band = 'fail'
  } else {
    band = 'partial'
  }

  return {
    id: 'ai_search_visibility',
    label: 'AI Search Visibility',
    band,
    score: BAND_SCORES[band],
    evidence: evidence.join(' | '),
  }
}
