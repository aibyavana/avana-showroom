import { CheckResult, BAND_SCORES } from '../rubric'

const PIXELS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Meta Pixel',     pattern: /fbq\(|facebook\.net\/en_US\/fbevents|connect\.facebook\.net/i },
  { name: 'GA4',            pattern: /gtag\(|googletagmanager\.com|analytics\.js|G-[A-Z0-9]{6,}/i },
  { name: 'Google Ads',     pattern: /googleadservices|AW-[0-9]+/i },
  { name: 'TikTok Pixel',   pattern: /analytics\.tiktok\.com|ttq\./i },
  { name: 'Pinterest Tag',  pattern: /pintrk\(|ct\.pinterest\.com/i },
  { name: 'Snapchat Pixel', pattern: /snaptr\(|sc-static\.net/i },
  { name: 'Twitter Pixel',  pattern: /static\.ads-twitter\.com|twq\(/i },
]

export async function checkPaidTrafficTracking(homepageHtml: string): Promise<CheckResult> {
  const detected = PIXELS.filter(p => p.pattern.test(homepageHtml)).map(p => p.name)
  const missing = PIXELS.filter(p => !p.pattern.test(homepageHtml)).map(p => p.name)

  const evidence = [
    `Pixels detected: ${detected.length > 0 ? detected.join(', ') : 'none'}`,
    `Not detected: ${missing.join(', ')}`,
    'Note: presence only — firing/configuration not verifiable from page source',
  ]

  let band: 'pass' | 'partial' | 'fail'
  if (detected.length >= 3) {
    band = 'pass'
  } else if (detected.length >= 1) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'paid_traffic_tracking',
    label: 'Paid Traffic & Tracking',
    band,
    score: BAND_SCORES[band],
    evidence: evidence.join(' | '),
  }
}
