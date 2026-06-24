import { notifyLead, notifHtml, row } from './notify'
import { formatSlot, SCHEDULE_CONFIG } from './availability'

export interface ConfirmConsultArgs {
  bookingId:       string
  paypalOrderId:   string
  email:           string
  firstName:       string
  services:        string[]
  note?:           string | null
  slotTime:        string   // UTC ISO
  durationMinutes: number   // 30 or 60
  amountCents:     number   // 25000 or 50000
  bookingType:     string   // 'first_call' | 'consulting'
  sourceTier?:     string
}

export async function confirmConsultBooking(
  args: ConfirmConsultArgs,
): Promise<{ ok: boolean; alreadyConfirmed: boolean }> {
  const {
    bookingId, paypalOrderId, email, firstName, services, note,
    slotTime, durationMinutes, amountCents, bookingType, sourceTier,
  } = args

  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[confirmConsult] Supabase admin creds not set')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Idempotency
  const { data: existing } = await admin
    .from('consult_call_bookings')
    .select('paid')
    .eq('id', bookingId)
    .single()

  if (existing?.paid) {
    console.log(`[confirmConsult] already confirmed — order ${paypalOrderId}`)
    return { ok: true, alreadyConfirmed: true }
  }

  // Slot conflict re-verify before committing
  const slotStart = new Date(slotTime)
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000)

  const { data: activeRows } = await admin
    .from('consult_call_bookings')
    .select('slot_time, duration_minutes')
    .eq('paid', true)
    .neq('id', bookingId)
    .not('slot_time', 'is', null)

  for (const r of activeRows ?? []) {
    if (!r.slot_time) continue
    const bStart = new Date(r.slot_time)
    const bEnd = new Date(bStart.getTime() + (r.duration_minutes ?? 30) * 60 * 1000)
    if (bStart < slotEnd && bEnd > slotStart) {
      console.error(`[confirmConsult] SLOT CONFLICT ${slotTime} — order ${paypalOrderId} needs manual refund`)
      try {
        await notifyLead({
          data: {
            subject: `ACTION REQUIRED: Slot conflict — refund ${firstName} ${email}`,
            html: notifHtml('Slot Conflict — Manual Refund Required', 'consult-booking', [
              row('Name', firstName),
              row('Email', email),
              row('Slot', formatSlot(slotTime, SCHEDULE_CONFIG.timezone)),
              row('Order ID', paypalOrderId),
              row('Action', 'Issue PayPal refund manually — slot was taken by another booking'),
            ]),
          },
        })
      } catch { /* must not throw */ }
      throw new Error('SLOT_CONFLICT')
    }
  }

  // Commit
  const { error: updateError } = await admin
    .from('consult_call_bookings')
    .update({
      paid:            true,
      paid_at:         new Date().toISOString(),
      paypal_order_id: paypalOrderId,
      hold_expires_at: null,
    })
    .eq('id', bookingId)

  if (updateError) {
    if (updateError.code === '23505') throw new Error('SLOT_CONFLICT')
    throw new Error(`[confirmConsult] DB update failed: ${updateError.message}`)
  }

  const amandaTz = SCHEDULE_CONFIG.timezone
  const slotAmanda = formatSlot(slotTime, amandaTz)
  const slotUtc = formatSlot(slotTime, 'UTC')
  const amountDisplay = `$${(amountCents / 100).toFixed(0)}`
  const durLabel = durationMinutes === 30 ? '30-minute' : '60-minute'
  const isConsulting = bookingType === 'consulting'

  const icsContent = buildIcs({ bookingId, slotTime, durationMinutes, firstName, email })

  // ── Booker confirmation email ─────────────────────────────────────────────
  const bookerHtml = isConsulting
    ? buildConsultingEmail({ firstName, slotAmanda, slotUtc, amandaTz, durLabel, amountDisplay, services, note, paypalOrderId })
    : buildFirstCallEmail({ firstName, slotAmanda, slotUtc, amandaTz, services, note, paypalOrderId })

  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[confirmConsult] RESEND_API_KEY not set — skipping booker email')
    } else {
      const { Resend } = await import('resend')
      const subject = isConsulting
        ? `Your ${durLabel} consulting session is confirmed`
        : 'Your first call is confirmed'
      const { error: emailError } = await new Resend(apiKey).emails.send({
        from:        'Amanda at AVANA <amanda@mail.avanashowroom.com>',
        to:          email,
        replyTo:     'amanda@avanashowroom.com',
        subject,
        html:        bookerHtml,
        attachments: [{ filename: 'session.ics', content: Buffer.from(icsContent) }],
      })
      if (emailError) console.error('[confirmConsult] booker email failed:', emailError)
    }
  } catch (e) {
    console.error('[confirmConsult] booker email threw:', e)
  }

  // ── Amanda alert ──────────────────────────────────────────────────────────
  try {
    const alertSubject = isConsulting
      ? `Consulting session booked + paid — ${durLabel} | ${slotAmanda}`
      : `First call booked + paid — ${slotAmanda}`
    await notifyLead({
      data: {
        subject: alertSubject,
        html: notifHtml(
          isConsulting ? 'Consulting Session Booked' : 'First Call Booked',
          'consult-booking',
          [
            row('Name', firstName),
            row('Email', email),
            row('Slot (Vancouver)', slotAmanda),
            row('Duration', `${durationMinutes} minutes`),
            row('Amount', amountDisplay),
            row('Type', bookingType),
            ...(services.length ? [row('Topics', services.join(', '))] : []),
            row('Note', note ?? null),
            row('Order ID', paypalOrderId),
            ...(sourceTier ? [row('Interested in', sourceTier)] : []),
          ],
        ),
      },
    })
  } catch (e) {
    console.error('[confirmConsult] Amanda alert failed:', e)
  }

  return { ok: true, alreadyConfirmed: false }
}

// ── Email builders ────────────────────────────────────────────────────────────

function buildFirstCallEmail(p: {
  firstName: string; slotAmanda: string; slotUtc: string; amandaTz: string
  services: string[]; note: string | null | undefined; paypalOrderId: string
}): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0F;padding:24px 32px;margin-bottom:24px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AI by AVANA</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">Your first call is confirmed.</h1>
  </div>
  <p style="font-size:16px;line-height:1.6;margin-bottom:16px">Hi ${p.firstName},</p>
  <p style="font-size:16px;line-height:1.6;margin-bottom:20px">Your $500 deposit is received and your call is locked in.</p>
  <div style="background:#f7f4ef;border-left:3px solid #B8902E;padding:16px 20px;margin:0 0 24px">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8C6D1F;margin:0 0 6px">Your call time</p>
    <p style="font-size:17px;font-weight:700;margin:0 0 6px;color:#0A0A0F">${p.slotAmanda}</p>
    <p style="font-size:13px;color:#666;margin:0">Also: ${p.slotUtc}</p>
  </div>
  ${p.services.length ? `<p style="font-size:15px;line-height:1.6;margin-bottom:12px">What you want to cover: <strong>${p.services.join(', ')}</strong></p>` : ''}
  ${p.note ? `<p style="font-size:15px;line-height:1.6;margin-bottom:12px">Your note: ${p.note}</p>` : ''}
  <p style="font-size:15px;line-height:1.6;margin-bottom:16px">The $500 credits toward your build. I will send the call link and any prep details before we meet.</p>
  <p style="font-size:15px;line-height:1.6;margin-bottom:6px">Amanda</p>
  <p style="font-size:13px;color:#666;margin-bottom:24px">AI by AVANA</p>
  <p style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px">Order ID: ${p.paypalOrderId} &nbsp;|&nbsp; $500.00 USD &nbsp;|&nbsp; A calendar invite is attached.</p>
</div>`
}

function buildConsultingEmail(p: {
  firstName: string; slotAmanda: string; slotUtc: string; amandaTz: string
  durLabel: string; amountDisplay: string
  services: string[]; note: string | null | undefined; paypalOrderId: string
}): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0A0A0F;padding:24px 32px;margin-bottom:24px">
    <p style="color:#B8902E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">AVANA</p>
    <h1 style="color:#F7F4EF;font-size:20px;margin:0;font-weight:700">Your ${p.durLabel} session is confirmed.</h1>
  </div>
  <p style="font-size:16px;line-height:1.6;margin-bottom:16px">Hi ${p.firstName},</p>
  <p style="font-size:16px;line-height:1.6;margin-bottom:20px">${p.amountDisplay} received. Your session is booked.</p>
  <div style="background:#f7f4ef;border-left:3px solid #B8902E;padding:16px 20px;margin:0 0 24px">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8C6D1F;margin:0 0 6px">Session time</p>
    <p style="font-size:17px;font-weight:700;margin:0 0 6px;color:#0A0A0F">${p.slotAmanda}</p>
    <p style="font-size:13px;color:#666;margin:0">Also: ${p.slotUtc}</p>
  </div>
  ${p.services.length ? `<p style="font-size:15px;line-height:1.6;margin-bottom:12px">Topics: <strong>${p.services.join(', ')}</strong></p>` : ''}
  ${p.note ? `<p style="font-size:15px;line-height:1.6;margin-bottom:12px">Your note: ${p.note}</p>` : ''}
  <p style="font-size:15px;line-height:1.6;margin-bottom:16px">I will send the call link before we meet.</p>
  <p style="font-size:15px;line-height:1.6;margin-bottom:6px">Amanda</p>
  <p style="font-size:13px;color:#666;margin-bottom:24px">AVANA</p>
  <p style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px">Order ID: ${p.paypalOrderId} &nbsp;|&nbsp; ${p.amountDisplay} USD &nbsp;|&nbsp; A calendar invite is attached.</p>
</div>`
}

// ── .ics builder ─────────────────────────────────────────────────────────────

function toIcsDate(isoStr: string): string {
  return new Date(isoStr).toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z')
}

function buildIcs(args: {
  bookingId: string; slotTime: string; durationMinutes: number
  firstName: string; email: string
}): string {
  const { bookingId, slotTime, durationMinutes, firstName, email } = args
  const endIso = new Date(new Date(slotTime).getTime() + durationMinutes * 60 * 1000).toISOString()
  const summary = durationMinutes === 30
    ? '30-Minute Consulting Session with Amanda Van As'
    : '60-Minute Consulting Session with Amanda Van As'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AVANA Showroom//Consulting//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingId}@avanashowroom.com`,
    `DTSTART:${toIcsDate(slotTime)}`,
    `DTEND:${toIcsDate(endIso)}`,
    `SUMMARY:${summary}`,
    'DESCRIPTION:Amanda will send the meeting link separately.',
    'ORGANIZER;CN=Amanda Van As:mailto:amanda@avanashowroom.com',
    `ATTENDEE;RSVP=TRUE;CN=${firstName}:mailto:${email}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
