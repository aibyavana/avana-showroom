import { CheckResult, BAND_SCORES } from '../rubric'
import { fetchText } from '../crawl'

const ACCELERATED_CHECKOUT = [
  { name: 'Shop Pay',   pattern: /shop-pay|shoppay|shopify-payment/i },
  { name: 'Apple Pay',  pattern: /apple.?pay/i },
  { name: 'Google Pay', pattern: /google.?pay/i },
  { name: 'PayPal',     pattern: /paypal/i },
]

export async function checkCheckoutConversion(baseUrl: string, homepageHtml: string): Promise<CheckResult> {
  const evidence: string[] = []

  const isPasswordProtected = /password.*page|Enter.*password/i.test(homepageHtml)
    || homepageHtml.toLowerCase().includes('id="shopify-store-password"')
  evidence.push(`Store live (no password gate): ${isPasswordProtected ? 'NO — password-protected' : 'yes'}`)

  const cartRes = await fetchText(`${baseUrl}/cart`)
  const cartLive = !!cartRes && cartRes.length > 500
  evidence.push(`Cart page: ${cartLive ? 'accessible' : 'unreadable'}`)

  const detected = ACCELERATED_CHECKOUT.filter(a => a.pattern.test(homepageHtml)).map(a => a.name)
  evidence.push(`Accelerated checkout detected: ${detected.length > 0 ? detected.join(', ') : 'none visible on homepage'}`)

  // Conservative cap: post-add-to-cart conversion rate, cart abandonment, and funnel
  // depth are not readable from public pages. Cap at partial regardless of surface signals.
  evidence.push('Conversion rate, cart abandonment, and funnel depth not accessible from public pages')

  let band: 'pass' | 'partial' | 'fail'
  if (!isPasswordProtected && cartLive) {
    band = 'partial' // surface looks open but depth unverifiable
  } else {
    band = 'fail'
  }

  return {
    id: 'checkout_conversion',
    label: 'Checkout & Conversion Health',
    band,
    score: BAND_SCORES[band],
    evidence: `Directional read (shallow, public pages only) | ${evidence.join(' | ')}`,
  }
}
