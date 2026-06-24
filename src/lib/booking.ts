import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { generateAvailableSlots } from './availability'
import { confirmConsultBooking } from './consult-fulfillment'

function paypalBase(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) throw new Error('[paypal] PAYPAL_CLIENT_ID or PAYPAL_SECRET not set')
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`[paypal] Token fetch failed: ${res.status}`)
  const json = await res.json() as { access_token: string }
  return json.access_token
}

// Server-authoritative pricing — client cannot override
function computeAmountCents(bookingType: string, durationMinutes: number): number {
  if (bookingType === 'first_call') return 50000            // always $500
  if (bookingType === 'consulting') return durationMinutes === 30 ? 25000 : 50000
  return 50000
}

async function getAdminClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[booking] Supabase admin creds not set')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// ── 1. Get available slots ────────────────────────────────────────────────────

export const getAvailableSlots = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => z.object({
    durationMinutes: z.number().int().min(30).max(60).optional().default(30),
  }).parse(raw))
  .handler(async ({ data }): Promise<{ slots: string[] }> => {
    const admin = await getAdminClient()
    const now = new Date()
    const holdCutoff = now.toISOString()

    const { data: rows } = await admin
      .from('consult_call_bookings')
      .select('slot_time, paid, hold_expires_at, duration_minutes')
      .not('slot_time', 'is', null)

    // Build takenMs: every occupied 30-min block (expand multi-slot bookings)
    const takenMs = new Set<number>()
    for (const row of rows ?? []) {
      if (!row.slot_time) continue
      const isActive = row.paid || (row.hold_expires_at && row.hold_expires_at > holdCutoff)
      if (!isActive) continue
      const startMs = new Date(row.slot_time).getTime()
      const durMin = row.duration_minutes ?? 30
      for (let offset = 0; offset < durMin; offset += 30) {
        takenMs.add(startMs + offset * 60 * 1000)
      }
    }

    const slots = generateAvailableSlots(takenMs, now, data.durationMinutes)
    return { slots: slots.map(d => d.toISOString()) }
  })

// ── 2. Hold a slot ────────────────────────────────────────────────────────────

export const holdSlot = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => z.object({
    slotTime:        z.string().min(1),
    firstName:       z.string().min(1).max(120),
    email:           z.string().email().max(254),
    services:        z.array(z.string()).optional().default([]),
    note:            z.string().max(1000).optional(),
    durationMinutes: z.number().int().min(30).max(60).optional().default(30),
    bookingType:     z.string().optional().default('first_call'),
  }).parse(raw))
  .handler(async ({ data }): Promise<{ bookingId: string }> => {
    const admin = await getAdminClient()
    const now = new Date()
    const slotStart = new Date(data.slotTime)
    const durationMinutes = data.durationMinutes
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000)

    // Fetch all active bookings (paid or valid hold) for overlap check
    const holdCutoff = now.toISOString()
    const { data: activeRows } = await admin
      .from('consult_call_bookings')
      .select('slot_time, paid, hold_expires_at, duration_minutes')
      .not('slot_time', 'is', null)

    for (const row of activeRows ?? []) {
      if (!row.slot_time) continue
      const isActive = row.paid || (row.hold_expires_at && row.hold_expires_at > holdCutoff)
      if (!isActive) continue
      const bStart = new Date(row.slot_time)
      const bEnd = new Date(bStart.getTime() + (row.duration_minutes ?? 30) * 60 * 1000)
      // Overlap: existing [bStart, bEnd) overlaps new [slotStart, slotEnd)
      if (bStart < slotEnd && bEnd > slotStart) throw new Error('SLOT_TAKEN')
    }

    const amountCents = computeAmountCents(data.bookingType, durationMinutes)
    const bookingId = crypto.randomUUID()
    const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

    const { error } = await admin
      .from('consult_call_bookings')
      .insert({
        id:               bookingId,
        slot_time:        data.slotTime,
        first_name:       data.firstName,
        email:            data.email.toLowerCase(),
        services:         data.services,
        note:             data.note ?? null,
        paid:             false,
        hold_expires_at:  holdExpiresAt,
        duration_minutes: durationMinutes,
        amount_cents:     amountCents,
        booking_type:     data.bookingType,
      })

    if (error) {
      if (error.code === '23505') throw new Error('SLOT_TAKEN')
      throw new Error(`[booking] Insert failed: ${error.message}`)
    }

    return { bookingId }
  })

// ── 3. Create PayPal order (amount read from DB — server-authoritative) ───────

export const createConsultOrder = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => z.object({ bookingId: z.string().min(1) }).parse(raw))
  .handler(async ({ data }): Promise<{ orderId: string }> => {
    const admin = await getAdminClient()

    const { data: booking, error } = await admin
      .from('consult_call_bookings')
      .select('amount_cents, duration_minutes, booking_type')
      .eq('id', data.bookingId)
      .single()

    if (error || !booking) throw new Error(`[booking] Booking not found: ${data.bookingId}`)

    const amountStr = (booking.amount_cents / 100).toFixed(2)
    const durLabel = booking.duration_minutes === 30 ? '30 min' : '60 min'
    const description = booking.booking_type === 'consulting'
      ? `AVANA consulting call (${durLabel})`
      : 'AVANA first call deposit'

    const token = await getAccessToken()
    const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amountStr },
          description,
          custom_id: data.bookingId,
        }],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`[paypal] Create order failed ${res.status}: ${body}`)
    }
    const order = await res.json() as { id: string }
    return { orderId: order.id }
  })

// ── 4. Capture + confirm ──────────────────────────────────────────────────────

export const captureConsultOrder = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => z.object({
    orderId:    z.string().min(1),
    bookingId:  z.string().min(1),
    sourceTier: z.string().optional(),
  }).parse(raw))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const token = await getAccessToken()
    const res = await fetch(`${paypalBase()}/v2/checkout/orders/${data.orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`[paypal] Capture failed ${res.status}: ${body}`)
    }
    const capture = await res.json() as { status: string; id: string }
    if (capture.status !== 'COMPLETED') {
      throw new Error(`[paypal] Capture status not COMPLETED: ${capture.status}`)
    }

    const admin = await getAdminClient()
    const { data: booking, error } = await admin
      .from('consult_call_bookings')
      .select('email, first_name, services, note, slot_time, duration_minutes, amount_cents, booking_type')
      .eq('id', data.bookingId)
      .single()

    if (error || !booking || !booking.slot_time) {
      throw new Error(`[booking] Booking row not found: ${data.bookingId}`)
    }

    await confirmConsultBooking({
      bookingId:       data.bookingId,
      paypalOrderId:   capture.id,
      email:           booking.email,
      firstName:       booking.first_name,
      services:        booking.services ?? [],
      note:            booking.note,
      slotTime:        booking.slot_time,
      durationMinutes: booking.duration_minutes ?? 30,
      amountCents:     booking.amount_cents ?? 50000,
      bookingType:     booking.booking_type ?? 'first_call',
      sourceTier:      data.sourceTier,
    })

    return { ok: true }
  })
