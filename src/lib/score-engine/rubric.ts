// Shared rubric — single source of truth for both Health Check and Visibility Score.
// Neither presentation invents its own thresholds.

export type Band = 'pass' | 'partial' | 'fail' | 'pending'

export interface CheckResult {
  id: string
  label: string
  band: Band
  score: number   // 9 = pass, 5 = partial, 2 = fail, 0 = pending/unreadable
  evidence: string
}

export const BAND_SCORES: Record<Band, number> = {
  pass:    9,
  partial: 5,
  fail:    2,
  pending: 0,
}

// Health Check verdict bands (/100)
export function healthVerdict(total: number): string {
  if (total >= 80) return 'Strong'
  if (total >= 60) return 'Leaking'
  if (total >= 40) return 'Underperforming'
  return 'Critical'
}

// Visibility readiness bands (/100)
export function visibilityBand(total: number): string {
  if (total >= 80) return 'AI-Ready'
  if (total >= 60) return 'Partially Ready'
  if (total >= 40) return 'At Risk'
  return 'Invisible'
}

// Check IDs — keep in sync with checks/ filenames
export const CHECK_IDS = [
  'ai_search_visibility',
  'seo_geo_foundations',
  'product_data_completeness',
  'catalog_structure',
  'email_retention',
  'checkout_conversion',
  'paid_traffic_tracking',
  'wholesale_readiness',
  'mobile_performance',
  'brand_content_consistency', // judgment layer
] as const

export type CheckId = typeof CHECK_IDS[number]

// Visibility dimension mapping: which checks contribute to each /20 dimension
export const VISIBILITY_DIMENSIONS: Array<{
  id: string
  label: string
  checkIds: CheckId[]
  weight: number  // how many raw check points map into 20
}> = [
  {
    id: 'findability',
    label: 'Findability by AI',
    checkIds: ['ai_search_visibility', 'seo_geo_foundations'],
    weight: 18,
  },
  {
    id: 'discoverability',
    label: 'Discoverability (SEO / GEO)',
    checkIds: ['seo_geo_foundations', 'product_data_completeness'],
    weight: 18,
  },
  {
    id: 'data_readiness',
    label: 'Data Readiness',
    checkIds: ['product_data_completeness', 'catalog_structure'],
    weight: 18,
  },
  {
    id: 'automation_potential',
    label: 'Automation Potential',
    checkIds: ['email_retention', 'paid_traffic_tracking'],
    weight: 18,
  },
  {
    id: 'channel_sprawl',
    label: 'Channel & Tool Sprawl',
    checkIds: ['paid_traffic_tracking', 'wholesale_readiness'],
    weight: 18,
  },
]
