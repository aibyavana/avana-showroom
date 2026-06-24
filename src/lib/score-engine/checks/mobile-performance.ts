import { CheckResult, BAND_SCORES } from '../rubric'

interface PageSpeedResult {
  performanceScore: number
  lcp: number | null   // seconds
  cls: number | null
  fcp: number | null   // seconds
  tbt: number | null   // milliseconds
}

async function fetchPageSpeed(url: string, apiKey: string): Promise<PageSpeedResult | null> {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 55_000)
    const res = await fetch(endpoint, { signal: controller.signal })
    if (!res.ok) return null
    const json = await res.json() as Record<string, unknown>
    const cats = (json.lighthouseResult as Record<string, unknown>)?.categories as Record<string, unknown> | undefined
    const audits = (json.lighthouseResult as Record<string, unknown>)?.audits as Record<string, unknown> | undefined
    if (!cats || !audits) return null

    const perf = (cats.performance as Record<string, unknown>)?.score as number | null
    const lcpAudit = (audits['largest-contentful-paint'] as Record<string, unknown>)?.numericValue as number | null
    const clsAudit = (audits['cumulative-layout-shift'] as Record<string, unknown>)?.numericValue as number | null
    const fcpAudit = (audits['first-contentful-paint'] as Record<string, unknown>)?.numericValue as number | null
    const tbtAudit = (audits['total-blocking-time'] as Record<string, unknown>)?.numericValue as number | null

    return {
      performanceScore: Math.round((perf ?? 0) * 100),
      lcp: lcpAudit ? Math.round((lcpAudit / 1000) * 10) / 10 : null,
      cls: clsAudit ? Math.round(clsAudit * 100) / 100 : null,
      fcp: fcpAudit ? Math.round((fcpAudit / 1000) * 10) / 10 : null,
      tbt: tbtAudit ? Math.round(tbtAudit) : null,
    }
  } catch {
    return null
  }
}

function medianOf(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10 : s[mid]
}

async function fetchPageSpeedMedian(url: string, apiKey: string): Promise<PageSpeedResult | null> {
  // 3 parallel calls — runs within the same wall-clock window as a single 55s call.
  // Median smooths out PageSpeed infrastructure noise (single readings vary 20–40% on shared infra).
  const results = await Promise.all([
    fetchPageSpeed(url, apiKey),
    fetchPageSpeed(url, apiKey),
    fetchPageSpeed(url, apiKey),
  ])
  const valid = results.filter(Boolean) as PageSpeedResult[]
  if (valid.length === 0) return null

  const pick = <T>(arr: (T | null)[], fn: (v: T) => number): number | null => {
    const nums = arr.filter((x): x is T => x != null).map(fn)
    return nums.length > 0 ? medianOf(nums) : null
  }

  return {
    performanceScore: medianOf(valid.map(r => r.performanceScore)),
    lcp:  pick(valid.map(r => r.lcp),  v => v),
    cls:  pick(valid.map(r => r.cls),  v => v),
    fcp:  pick(valid.map(r => r.fcp),  v => v),
    tbt:  pick(valid.map(r => r.tbt),  v => v),
  }
}

export async function checkMobilePerformance(storeUrl: string): Promise<CheckResult> {
  const apiKey = process.env.PAGESPEED_API_KEY

  if (!apiKey) {
    return {
      id: 'mobile_performance',
      label: 'Mobile & Site Performance',
      band: 'partial',
      score: BAND_SCORES.partial,
      evidence: 'PAGESPEED_API_KEY not set — skipping measurement',
    }
  }

  const result = await fetchPageSpeedMedian(storeUrl, apiKey)

  if (!result) {
    return {
      id: 'mobile_performance',
      label: 'Mobile & Site Performance',
      band: 'partial',
      score: BAND_SCORES.partial,
      evidence: 'PageSpeed API call failed or timed out — score is directional only',
    }
  }

  const { performanceScore, lcp, cls, fcp, tbt } = result
  const evidence = [
    `PageSpeed mobile: ${performanceScore}/100`,
    lcp != null ? `LCP: ${lcp}s` : null,
    cls != null ? `CLS: ${cls}` : null,
    fcp != null ? `FCP: ${fcp}s` : null,
    tbt != null ? `TBT: ${tbt}ms` : null,
  ].filter(Boolean).join(' | ')

  let band: 'pass' | 'partial' | 'fail'
  if (performanceScore >= 70 && (lcp == null || lcp <= 2.5)) {
    band = 'pass'
  } else if (performanceScore >= 50) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'mobile_performance',
    label: 'Mobile & Site Performance',
    band,
    score: BAND_SCORES[band],
    evidence,
  }
}
