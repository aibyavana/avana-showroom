import { defineEventHandler, readRawBody, getHeaders } from 'h3'
import { fulfillKit } from '../../../../src/lib/kit-fulfillment'
import { confirmConsultBooking } from '../../../../src/lib/consult-fulfillment'
import { notifyLead, notifHtml, row } from '../../../../src/lib/notify'

// ── Signature verification ────────────────────────────────────────────────────
// Uses PayPal's /v1/notifications/verify-webhook-signature REST endpoint.
// Two fetch() calls only — no Node crypto. Works on Cloudflare Workers.

async function verifyPayPalWebhookSig(
  headers: Record<string, string | undefined>,
  rawBody: string,
): Promise<void> {
  const base = process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const clientId  = process.env.PAYPAL_CLIENT_ID
  const secret    = process.env.PAYPAL_SECRET
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!clientId || !secret || !webhookId) {
    throw new Error('[paypal-webhook] Missing PAYPAL_CLIENT_ID, PAYPAL_SECRET, or PAYPAL_WEBHOOK_ID')
  }

  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!tokenRes.ok) throw new Error(`[paypal-webhook] Token fetch failed: ${tokenRes.status}`)
  const { access_token: token } = await tokenRes.json() as { access_token: string }

  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo:         headers['paypal-auth-algo'],
      cert_url:          headers['paypal-cert-url'],
      transmission_id:   headers['paypal-transmission-id'],
      transmission_sig:  headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id:        webhookId,
      webhook_event:     JSON.parse(rawBody),
    }),
  })
  if (!verifyRes.ok) throw new Error(`[paypal-webhook] Verify call failed: ${verifyRes.status}`)
  const { verification_status } = await verifyRes.json() as { verification_status: string }
  if (verification_status !== 'SUCCESS') {
    throw new Error(`[paypal-webhook] Signature verification failed: ${verification_status}`)
  }
}

// ── Supabase admin client ─────────────────────────────────────────────────────

async function getAdmin() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[paypal-webhook] Supabase admin creds not set')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? ''
  const headers = getHeaders(event)

  // ── 1. Signature verification ─────────────────────────────────────────────
  // Skip only in local dev with PAYPAL_SKIP_WEBHOOK_SIG=true. REMOVE before deploy.
  if (process.env.PAYPAL_SKIP_WEBHOOK_SIG !== 'true') {
    try {
      await verifyPayPalWebhookSig(headers, rawBody)
    } catch (e) {
      console.error('[paypal-webhook] Sig verification failed:', e)
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { event_type?: string; resource?: Record<string, unknown> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // Ack any event type we don't handle — PayPal expects 200 for everything
  if (body.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return new Response('OK', { status: 200 })
  }

  const resource  = body.resource ?? {}
  // resource.id for PAYMENT.CAPTURE.COMPLETED is the Capture ID — same value as
  // capture.id returned by the Orders v2 capture API on the client path.
  const captureId = resource.id as string | undefined
  // custom_id is set at order creation time: leadId (kit) or bookingId (consult/first_call)
  const customId  = resource.custom_id as string | undefined

  if (!customId || !captureId) {
    console.warn('[paypal-webhook] PAYMENT.CAPTURE.COMPLETED missing custom_id or id — skipping')
    return new Response('OK', { status: 200 })
  }

  // ── 3. Identify payment type ──────────────────────────────────────────────
  // custom_id is a UUID that maps to either audit_kit_leads or consult_call_bookings.
  // Try kit first (most common), then booking.
  let admin: Awaited<ReturnType<typeof getAdmin>>
  try {
    admin = await getAdmin()
  } catch (e) {
    console.error('[paypal-webhook] Supabase init failed:', e)
    return new Response('Internal Server Error', { status: 500 })
  }

  const { data: kitRow } = await admin
    .from('audit_kit_leads')
    .select('id, email, first_name, paid')
    .eq('id', customId)
    .maybeSingle()

  if (kitRow) {
    // ── Kit payment ────────────────────────────────────────────────────────
    if (kitRow.paid) {
      // Already fulfilled by the client capture path — no-op
      console.log(`[paypal-webhook] kit already fulfilled — ${customId}`)
      return new Response('OK', { status: 200 })
    }

    const task = fulfillKit({
      leadId:        customId,
      paypalOrderId: captureId,
      email:         kitRow.email,
      firstName:     kitRow.first_name,
    }).catch(async (e) => {
      console.error('[paypal-webhook] fulfillKit threw:', e)
      try {
        await notifyLead({
          data: {
            subject: `WEBHOOK FAIL: Kit not delivered — ${kitRow.email}`,
            html: notifHtml('Webhook Kit Fulfillment Failed', 'paypal-webhook', [
              row('Email',      kitRow.email),
              row('Lead ID',    customId),
              row('Capture ID', captureId),
              row('Error',      String(e)),
              row('Action',     'Send kit manually'),
            ]),
          },
        })
      } catch { /* alert failure must not throw */ }
    })

    // waitUntil keeps the Worker alive after 200 is returned
    // event.req.waitUntil is bound by Nitro's augmentReq from the CF ExecutionContext
    const wU = (event.req as unknown as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil
    if (typeof wU === 'function') {
      console.log('[paypal-webhook] kit: waitUntil path')
      wU(task)
    } else {
      console.log('[paypal-webhook] kit: direct await (dev or ctx unavailable)')
      await task
    }

    return new Response('OK', { status: 200 })
  }

  // ── Booking payment (first_call or consulting) ─────────────────────────────
  const { data: booking } = await admin
    .from('consult_call_bookings')
    .select('id, email, first_name, services, note, slot_time, duration_minutes, amount_cents, booking_type, paid')
    .eq('id', customId)
    .maybeSingle()

  if (!booking) {
    // Not in either table — could be a stale test order, just ack
    console.warn(`[paypal-webhook] custom_id ${customId} not found in kit leads or bookings — skipping`)
    return new Response('OK', { status: 200 })
  }

  if (booking.paid) {
    console.log(`[paypal-webhook] booking already confirmed — ${customId}`)
    return new Response('OK', { status: 200 })
  }

  if (!booking.slot_time) {
    console.error(`[paypal-webhook] booking ${customId} has no slot_time — cannot confirm`)
    return new Response('OK', { status: 200 })
  }

  const confirmTask = confirmConsultBooking({
    bookingId:       customId,
    paypalOrderId:   captureId,
    email:           booking.email,
    firstName:       booking.first_name,
    services:        booking.services ?? [],
    note:            booking.note,
    slotTime:        booking.slot_time,
    durationMinutes: booking.duration_minutes ?? 30,
    amountCents:     booking.amount_cents ?? 50000,
    bookingType:     booking.booking_type ?? 'first_call',
  }).catch(async (e) => {
    const isSlotConflict = String(e).includes('SLOT_CONFLICT')
    console.error(`[paypal-webhook] confirmConsultBooking threw${isSlotConflict ? ' (SLOT_CONFLICT — alert already sent)' : ''}:`, e)
    if (!isSlotConflict) {
      // SLOT_CONFLICT sends its own notifyLead inside confirmConsultBooking — skip double-alert
      try {
        await notifyLead({
          data: {
            subject: `WEBHOOK FAIL: Booking not confirmed — ${booking.email}`,
            html: notifHtml('Webhook Booking Confirmation Failed', 'paypal-webhook', [
              row('Email',      booking.email),
              row('Booking ID', customId),
              row('Capture ID', captureId),
              row('Type',       booking.booking_type ?? 'first_call'),
              row('Slot',       booking.slot_time),
              row('Error',      String(e)),
              row('Action',     'Confirm booking manually, send ICS'),
            ]),
          },
        })
      } catch { /* alert failure must not throw */ }
    }
  })

  const wU2 = (event.req as unknown as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil
  if (typeof wU2 === 'function') {
    console.log('[paypal-webhook] booking: waitUntil path')
    wU2(confirmTask)
  } else {
    console.log('[paypal-webhook] booking: direct await (dev or ctx unavailable)')
    await confirmTask
  }

  return new Response('OK', { status: 200 })
})
