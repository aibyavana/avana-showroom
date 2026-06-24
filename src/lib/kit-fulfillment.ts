import { notifyLead, notifHtml, row } from './notify'

export interface FulfillKitArgs {
  leadId: string
  paypalOrderId: string
  email: string
  firstName: string
}

export async function fulfillKit(args: FulfillKitArgs): Promise<{ ok: boolean; alreadyFulfilled: boolean }> {
  const { leadId, paypalOrderId, email, firstName } = args

  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[fulfillKit] Supabase admin creds not set')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Idempotency: if already marked paid, bail out early
  const { data: existing } = await admin
    .from('audit_kit_leads')
    .select('paid')
    .eq('id', leadId)
    .single()

  if (existing?.paid) {
    console.log(`[fulfillKit] already fulfilled — order ${paypalOrderId}`)
    return { ok: true, alreadyFulfilled: true }
  }

  // Mark paid first so the payment is never lost, even if delivery fails
  const { error: updateError } = await admin
    .from('audit_kit_leads')
    .update({ paid: true, paid_at: new Date().toISOString(), paypal_order_id: paypalOrderId })
    .eq('id', leadId)

  if (updateError) {
    console.error('[fulfillKit] DB update failed:', updateError)
    throw new Error('[fulfillKit] Failed to mark lead as paid')
  }

  // Surface any delivery failure to Amanda so no paid order ever silently vanishes
  const alertDeliveryFailed = async (reason: string) => {
    console.error(`[fulfillKit] Delivery failed — ${reason} — order ${paypalOrderId}`)
    try {
      await notifyLead({
        data: {
          subject: `PAID but delivery failed — ${firstName} ${email}`,
          html: notifHtml('Kit PAID — Delivery Failed', 'paypal-webhook', [
            row('Name', firstName),
            row('Email', email),
            row('Order ID', paypalOrderId),
            row('Amount', '$297.00'),
            row('Reason', reason),
            row('Action needed', 'Send kit manually'),
          ]),
        },
      })
    } catch { /* alert failure must never mask the original issue */ }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[fulfillKit] RESEND_API_KEY not set — skipping kit email')
  } else {
    // ── Step 1: fetch PDF from public URL (no filesystem — Workers-compatible) ──
    // Requires SITE_URL env var in Cloudflare Pages. Falls back to production domain.
    let pdfBuffer: Buffer
    try {
      const siteUrl = process.env.SITE_URL ?? 'https://avanashowroom.com'
      const pdfRes = await fetch(`${siteUrl}/AVANA-DIY-Store-Audit-Kit.pdf`)
      if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`)
      pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())
    } catch (e) {
      await alertDeliveryFailed(`PDF fetch error — ${e instanceof Error ? e.message : String(e)}`)
      return { ok: true, alreadyFulfilled: false }
    }

    // ── Step 2: send email with attachment ───────────────────────────────────
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)

      const kitHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0A;padding:24px 32px;margin-bottom:24px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA Showroom</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">Your DIY Store Audit Kit</h1>
  </div>
  <p style="font-size:16px;line-height:1.6;margin-bottom:16px">Hi ${firstName},</p>
  <p style="font-size:16px;line-height:1.6;margin-bottom:16px">
    Thank you. Your payment of $297 was received and your kit is attached to this email.
  </p>
  <p style="font-size:16px;line-height:1.6;margin-bottom:16px">
    Work through it at your own pace. When you're ready to take it further, this $297 credits toward a full store audit with me directly.
  </p>
  <p style="font-size:16px;line-height:1.6;margin-bottom:8px">Amanda</p>
  <p style="font-size:13px;color:#666;margin-bottom:24px">AVANA Showroom</p>
  <p style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px">
    Order ID: ${paypalOrderId} &nbsp;|&nbsp; $297.00 USD
  </p>
</div>`

      const { error: emailError } = await resend.emails.send({
        from: 'Amanda at AVANA <amanda@mail.avanashowroom.com>',
        to: email,
        replyTo: 'amanda@avanashowroom.com',
        subject: 'Your AVANA DIY Store Audit Kit',
        html: kitHtml,
        attachments: [{ filename: 'AVANA-DIY-Store-Audit-Kit.pdf', content: pdfBuffer }],
      })

      if (emailError) {
        await alertDeliveryFailed(`Resend error — ${JSON.stringify(emailError)}`)
        return { ok: true, alreadyFulfilled: false }
      }

      // Kit confirmed sent — flip the kit_sent flag for observability
      await admin
        .from('audit_kit_leads')
        .update({ kit_sent: true })
        .eq('id', leadId)

    } catch (e) {
      await alertDeliveryFailed(`Resend threw — ${e instanceof Error ? e.message : String(e)}`)
      return { ok: true, alreadyFulfilled: false }
    }
  }

  // Success alert to Amanda
  try {
    await notifyLead({
      data: {
        subject: `Kit PAID — ${firstName} ${email}`,
        html: notifHtml('New Kit Purchase', 'paypal-checkout', [
          row('Name', firstName),
          row('Email', email),
          row('Order ID', paypalOrderId),
          row('Amount', '$297.00'),
        ]),
      },
    })
  } catch (e) {
    console.error('[fulfillKit] Amanda alert failed:', e)
  }

  return { ok: true, alreadyFulfilled: false }
}
