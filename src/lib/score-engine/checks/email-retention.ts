import { CheckResult, BAND_SCORES } from '../rubric'

const ESP_SIGNALS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Klaviyo',        pattern: /klaviyo/i },
  { name: 'Shopify Email',  pattern: /shopify-email|shop\.app/i },
  { name: 'Mailchimp',      pattern: /mailchimp|mc\.js/i },
  { name: 'Drip',           pattern: /getdrip\.com/i },
  { name: 'Postscript',     pattern: /postscript/i },
  { name: 'Attentive',      pattern: /attentivemobile/i },
  { name: 'Omnisend',       pattern: /omnisend/i },
]

const SIGNUP_SIGNALS = [
  /newsletter/i,
  /subscribe/i,
  /sign.?up/i,
  /join.*list/i,
  /email.*updates/i,
  /get.*10|10%.+email/i,
]

export async function checkEmailRetention(homepageHtml: string): Promise<CheckResult> {
  const evidence: string[] = []

  const detectedEsps = ESP_SIGNALS.filter(e => e.pattern.test(homepageHtml)).map(e => e.name)
  evidence.push(`ESP detected: ${detectedEsps.length > 0 ? detectedEsps.join(', ') : 'none'}`)

  const hasSignup = SIGNUP_SIGNALS.some(p => p.test(homepageHtml))
  evidence.push(`Newsletter signup: ${hasSignup ? 'found on homepage' : 'not found on homepage'}`)

  const hasPopupHint = /popup|flyout|modal.*email|email.*modal/i.test(homepageHtml)
  if (hasPopupHint) evidence.push('Email popup/flyout: likely present (cannot confirm without JS execution)')

  // Conservative cap: the paid audit checks flow count, open rates, active sequences,
  // and list health — none readable from public source. Cap at partial regardless of signals.
  evidence.push('Automation depth (flows, open rates, list health) not readable from public page source')

  let band: 'pass' | 'partial' | 'fail'
  if (detectedEsps.length > 0 && hasSignup) {
    band = 'partial' // infrastructure signals present but depth unverifiable
  } else if (detectedEsps.length > 0 || hasSignup) {
    band = 'partial'
  } else {
    band = 'fail'
  }

  return {
    id: 'email_retention',
    label: 'Email & Retention Setup',
    band,
    score: BAND_SCORES[band],
    evidence: evidence.join(' | '),
  }
}
