import { CheckResult, BAND_SCORES } from './rubric'

interface JudgmentInput {
  brandText: string
  storeUrl: string
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

const PROMPT = `You are a wholesale fashion industry analyst who has reviewed thousands of brand storefronts. A fashion founder has asked you for an honest read on their brand's digital presence.

Evaluate the following brand text (homepage hero copy, navigation, and above-fold content) on two dimensions:
1. Brand coherence — is there a single clear aesthetic, defined primary customer, and specific point of view? Or is the identity blurred?
2. Premium signal — would a retail buyer at a serious boutique feel confident placing a wholesale order after this first impression?

Rules for your observation:
- Be specific. Name what you actually see — a navigation structure, a specific phrase, a missing element. Generic feedback is worthless.
- Be candid. If something is genuinely weak, say what the weakness IS, not around it.
- Stay constructive. Frame gaps as fixable problems the brand can act on. You are an expert helping them, not judging their worth.
- Never use contemptuous language. "Reads like a catalog" is useful. "Masquerading as a brand" is insulting. The difference is: one names the problem, the other dismisses the person.
- One to two sentences maximum. Dense is better than padded.

Return ONLY a JSON object with this exact shape:
{
  "band": "pass" | "partial" | "fail",
  "observation": "A specific 1-2 sentence observation naming what the brand copy signals and what the most important gap is, framed as something the brand can fix."
}

Band guide: pass = clear voice, defined customer, would earn a boutique buyer's attention immediately. partial = some signals present but something blurs the identity — one specific fix would lift it. fail = the identity is unclear or missing — a buyer would need to do too much work to understand what this brand is.

Brand text to evaluate:
"""
{{BRAND_TEXT}}
"""

Store URL: {{STORE_URL}}`

export async function checkBrandContentConsistency(input: JudgmentInput): Promise<CheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return stubResult('ANTHROPIC_API_KEY not set')
  }

  try {
    const prompt = PROMPT
      .replace('{{BRAND_TEXT}}', input.brandText.slice(0, 1500))
      .replace('{{STORE_URL}}', input.storeUrl)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[judgment] Anthropic API error:', res.status, errText)
      // Graceful stub on auth/billing errors — run still completes on deterministic checks
      if ([400, 401, 402, 403].includes(res.status)) {
        return stubResult(`API returned ${res.status} — check billing or API key`)
      }
      return stubResult(`API error ${res.status}`)
    }

    const json = await res.json() as AnthropicResponse
    const text = json.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return stubResult('Could not parse API response')

    const parsed = JSON.parse(jsonMatch[0]) as { band: 'pass' | 'partial' | 'fail'; observation: string }
    const band = (['pass', 'partial', 'fail'] as const).includes(parsed.band) ? parsed.band : 'partial'

    return {
      id: 'brand_content_consistency',
      label: 'Brand & Content Consistency',
      band,
      score: BAND_SCORES[band],
      evidence: parsed.observation ?? 'No observation returned',
    }
  } catch (err) {
    console.error('[judgment] Unexpected error:', err)
    return stubResult('Unexpected error — see server log')
  }
}

function stubResult(reason: string): CheckResult {
  return {
    id: 'brand_content_consistency',
    label: 'Brand & Content Consistency',
    band: 'pending',
    score: BAND_SCORES.pending,
    evidence: `Judgment layer unavailable — ${reason}`,
  }
}
