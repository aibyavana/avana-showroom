import { createServerFn } from '@tanstack/react-start'

export type NotifyPayload = { subject: string; html: string }

export function row(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;width:30%;vertical-align:top">${label}</td><td style="padding:8px 0 8px 16px;border-bottom:1px solid #eee;font-size:13px;font-weight:600;vertical-align:top">${value}</td></tr>`
}

export function notifHtml(title: string, source: string, rows: string[]): string {
  const ts = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Vancouver',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a"><div style="background:#0A0A0A;padding:24px 32px;margin-bottom:24px"><p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA Showroom</p><h1 style="color:#F7F4EF;font-size:18px;margin:0;font-weight:700">${title}</h1></div><table style="width:100%;border-collapse:collapse;margin-bottom:24px">${rows.join('')}</table><p style="color:#999;font-size:11px;border-top:1px solid #eee;padding-top:12px">Source: ${source} &nbsp;|&nbsp; ${ts} Vancouver</p></div>`
}

// ── Internal Amanda alert ─────────────────────────────────────────────────────

export const notifyLead = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => raw as NotifyPayload)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY not set — skipping notification')
      return { ok: true, skipped: true }
    }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    let error: unknown
    try {
      const result = await resend.emails.send({
        from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>',
        to: 'amanda@avanashowroom.com',
        replyTo: 'amanda@avanashowroom.com',
        subject: data.subject,
        html: data.html,
      })
      error = result.error
    } catch (e) {
      console.error('[notify] resend.emails.send threw:', e)
      return { ok: false, skipped: true }
    }
    if (error) {
      console.error('[email] Resend send failed:', error)
      return { ok: false }
    }
    return { ok: true }
  })

// ── Submitter confirmation (best-effort — never throws) ───────────────────────

export type ConfirmPayload = { to: string; subject: string; html: string; text: string }

export const confirmSubmitter = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => raw as ConfirmPayload)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY not set — skipping submitter confirmation')
      return { ok: true, skipped: true }
    }
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const { error } = await resend.emails.send({
        from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>',
        to: data.to,
        replyTo: 'amanda@avanashowroom.com',
        subject: data.subject,
        html: data.html,
        text: data.text,
      })
      if (error) {
        console.error('[email] confirmSubmitter send failed:', error)
        return { ok: false }
      }
      return { ok: true }
    } catch (e) {
      console.error('[email] confirmSubmitter threw:', e)
      return { ok: false }
    }
  })

// ── Confirmation email builders ───────────────────────────────────────────────

const FOOTER = `
<p style="color:#999;font-size:11px;border-top:1px solid #eee;padding-top:16px;margin-top:32px;line-height:1.6">
  Amanda Van As &nbsp;|&nbsp; AVANA Showroom &nbsp;|&nbsp; avanashowroom.com<br>
  You received this because you submitted a form at avanashowroom.com.
</p>`

export function retailerConfirmationEmail(firstName: string, storeName: string): { html: string; text: string } {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0F;padding:24px 32px;margin-bottom:32px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA Showroom</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">I received your application.</h1>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${firstName},</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Thank you for applying to carry with AVANA Showroom. I received your application for ${storeName} and I will review it personally.</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">I am selective about who I bring on, so this takes a little time. If your store is a fit, I will reach out directly to discuss the next steps.</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 32px">Thank you for your interest in AVANA.</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px">Amanda</p>
  <p style="font-size:13px;color:#666;margin:0 0 0">AVANA Showroom</p>
  ${FOOTER}
</div>`

  const text = `Hi ${firstName},

Thank you for applying to carry with AVANA Showroom. I received your application for ${storeName} and I will review it personally.

I am selective about who I bring on, so this takes a little time. If your store is a fit, I will reach out directly to discuss the next steps.

Thank you for your interest in AVANA.

Amanda
AVANA Showroom
avanashowroom.com

You received this because you submitted a form at avanashowroom.com.`

  return { html, text }
}

export function consultingConfirmationEmail(firstName: string, areas: string | null): { html: string; text: string } {
  const areasLine = areas
    ? `<p style="font-size:16px;line-height:1.7;margin:0 0 16px">I noted your focus areas: <strong>${areas}</strong>. I will keep that in mind when I respond.</p>`
    : ''
  const areasText = areas ? `I noted your focus areas: ${areas}. I will keep that in mind when I respond.\n\n` : ''

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0F;padding:24px 32px;margin-bottom:32px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">I received your note.</h1>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${firstName},</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Thank you for reaching out. I read every intake personally and I will respond with next steps if it is a fit.</p>
  ${areasLine}
  <p style="font-size:16px;line-height:1.7;margin:0 0 32px">Talk soon.</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px">Amanda</p>
  <p style="font-size:13px;color:#666;margin:0 0 0">AVANA</p>
  ${FOOTER}
</div>`

  const text = `Hi ${firstName},

Thank you for reaching out. I read every intake personally and I will respond with next steps if it is a fit.

${areasText}Talk soon.

Amanda
AVANA
avanashowroom.com

You received this because you submitted a form at avanashowroom.com.`

  return { html, text }
}

export function marketHitchConfirmationEmail(
  name: string,
  audience: 'buyer' | 'brand'
): { html: string; text: string } {
  const isBuyer = audience === 'buyer'
  const subjectLine = isBuyer
    ? "you're on the list."
    : "you're in the founding line."
  const bodyLine = isBuyer
    ? "we onboard verified boutiques in order. we'll reach out before launch to verify your store and set up your first season."
    : "the first cohort of brands is onboarded by hand, with verified commercial data, before the platform opens to buyers. we'll be in touch."
  const firstName = name.split(' ')[0] || name

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2A0815">
  <div style="background:#3E0620;padding:24px 32px;margin-bottom:0">
    <p style="color:#34EACD;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">market hitch</p>
    <h1 style="color:#F7F1EC;font-size:20px;margin:0;font-weight:500;font-style:italic">${subjectLine}</h1>
  </div>
  <div style="background:#5A0A2A;padding:24px 32px;margin-bottom:0">
    <p style="color:#F7F1EC;font-size:16px;line-height:1.7;margin:0 0 16px">hi ${firstName},</p>
    <p style="color:rgba(247,241,236,0.85);font-size:16px;line-height:1.7;margin:0 0 16px">${bodyLine}</p>
    <p style="color:rgba(247,241,236,0.85);font-size:16px;line-height:1.7;margin:0">talk soon,<br><span style="color:#F7F1EC;font-weight:500">amanda</span><br><span style="color:#EE7D73;font-size:13px">market hitch</span></p>
  </div>
  <div style="background:#3E0620;padding:16px 32px">
    <p style="color:rgba(247,241,236,0.4);font-size:11px;margin:0;line-height:1.6">
      market hitch. built by amanda van as.<br>
      you received this because you requested early access at avanashowroom.com/market-hitch.
    </p>
  </div>
</div>`

  const text = `hi ${firstName},

${bodyLine}

talk soon,
amanda
market hitch

---
you received this because you requested early access at avanashowroom.com/market-hitch.`

  return { html, text }
}

export function waitlistConfirmationEmail(firstName: string): { html: string; text: string } {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0F;padding:24px 32px;margin-bottom:32px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA Showroom</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">You are on the list.</h1>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${firstName},</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">I have you down for early access to the AVANA Retailer AI tools. I will be in touch when access opens.</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 32px">Amanda</p>
  <p style="font-size:13px;color:#666;margin:0 0 0">AVANA Showroom</p>
  ${FOOTER}
</div>`

  const text = `Hi ${firstName},

I have you down for early access to the AVANA Retailer AI tools. I will be in touch when access opens.

Amanda
AVANA Showroom
avanashowroom.com

You received this because you submitted a form at avanashowroom.com.`

  return { html, text }
}
