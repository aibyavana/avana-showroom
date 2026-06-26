import { defineEventHandler, getCookie, setResponseHeader, setResponseStatus } from 'h3'

const PRICES = { KIT: 297, DEPOSIT: 500, CONSULT_30: 250, CONSULT_60: 500 }

function buildRevenueByDay(kitLeads: any[], bookings: any[], days: number) {
  const now = new Date()
  const result: { date: string; kit: number; booking: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    result.push({ date: d.toISOString().slice(0, 10), kit: 0, booking: 0 })
  }
  const cutoff = result[0].date
  for (const k of kitLeads) {
    if (!k.paid || !k.paid_at) continue
    const day = k.paid_at.slice(0, 10)
    if (day < cutoff) continue
    const entry = result.find(r => r.date === day)
    if (entry) entry.kit += PRICES.KIT
  }
  for (const b of bookings) {
    if (!b.paid || !b.paid_at) continue
    const day = b.paid_at.slice(0, 10)
    if (day < cutoff) continue
    const entry = result.find(r => r.date === day)
    if (entry) entry.booking += (b.amount_cents ?? 0) / 100
  }
  return result
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  const env = (globalThis as any).__env__

  // Auth check
  const session = getCookie(event, 'admin_session')
  const token = env?.ADMIN_TOKEN ?? process.env.ADMIN_TOKEN
  if (!token || session !== token) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }

  // Everything else in one try-catch so the real error is always visible
  try {
    const url = env?.SUPABASE_URL ?? env?.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
    const key = env?.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

    if (!url || !key) {
      setResponseStatus(event, 500)
      return { error: `creds-missing url=${!!url} key=${!!key}` }
    }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    const [
      kitRes, intakeRes, bookingRes, scoreRes,
      insiderRes, marketRes, retailerAIRes, retailerAppRes,
    ] = await Promise.all([
      admin.from('audit_kit_leads').select('*').order('created_at', { ascending: false }),
      admin.from('consulting_intake').select('*').order('created_at', { ascending: false }),
      admin.from('consult_call_bookings').select('*').order('created_at', { ascending: false }),
      admin.from('score_leads').select('*').order('created_at', { ascending: false }),
      admin.from('insider_subscribers').select('*').order('created_at', { ascending: false }),
      admin.from('market_hitch_waitlist').select('*').order('created_at', { ascending: false }),
      admin.from('retailer_ai_waitlist').select('*').order('created_at', { ascending: false }),
      admin.from('retailer_applications').select('*').order('created_at', { ascending: false }),
    ])

    if (kitRes.error) {
      setResponseStatus(event, 500)
      return { error: `supabase-query: ${kitRes.error.message}`, hint: kitRes.error.hint }
    }

    const kitLeads     = kitRes.data ?? []
    const intake       = intakeRes.data ?? []
    const bookings     = bookingRes.data ?? []
    const scoreLeads   = scoreRes.data ?? []
    const insiderSubs  = insiderRes.data ?? []
    const marketHitch  = marketRes.data ?? []
    const retailerAI   = retailerAIRes.data ?? []
    const retailerApps = retailerAppRes.data ?? []

    const paidKits       = kitLeads.filter((k: any) => k.paid)
    const kitSales       = paidKits.length
    const kitRevenue     = kitSales * PRICES.KIT
    const kitStuck       = kitLeads.filter((k: any) => k.paid && !k.kit_sent).length
    const paidBookings   = bookings.filter((b: any) => b.paid)
    const bookingsPaid   = paidBookings.length
    const bookingRevenue = paidBookings.reduce((s: number, b: any) => s + (b.amount_cents ?? 0) / 100, 0)

    const scoreByStatus = {
      pending: scoreLeads.filter((s: any) => s.score_status === 'pending').length,
      sent:    scoreLeads.filter((s: any) => s.score_status === 'sent').length,
      failed:  scoreLeads.filter((s: any) => s.score_status === 'failed').length,
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const stuckScoreRows = scoreLeads.filter(
      (s: any) => s.score_status === 'pending' && s.created_at < twoHoursAgo
    )

    const scoredEmails  = new Set(scoreLeads.filter((s: any) => s.email).map((s: any) => (s.email as string).toLowerCase()))
    const paidKitEmails = new Set(paidKits.filter((k: any) => k.email).map((k: any) => (k.email as string).toLowerCase()))
    const intakeEmails  = new Set(intake.filter((i: any) => i.email).map((i: any) => (i.email as string).toLowerCase()))

    const revenueByDay = buildRevenueByDay(kitLeads, bookings, 30)

    return {
      metrics: {
        kitSales, kitRevenue, kitStuck,
        bookingsPaid, bookingRevenue,
        consultingInquiries: intake.length,
        scoreRequests: scoreLeads.length,
        scoreByStatus,
        scoreStuck: stuckScoreRows.length,
        insiderSubs: insiderSubs.length,
        marketHitch: marketHitch.length,
        retailerAI: retailerAI.length,
        retailerApps: retailerApps.length,
        totalLeads: kitLeads.length + intake.length + bookings.length + scoreLeads.length +
          insiderSubs.length + marketHitch.length + retailerAI.length + retailerApps.length,
      },
      opsIssues: {
        stuckKits:    kitLeads.filter((k: any) => k.paid && !k.kit_sent),
        failedScores: scoreLeads.filter((s: any) => s.score_status === 'failed'),
        stuckScores:  stuckScoreRows,
      },
      revenueByDay,
      recent: {
        kitLeads:         kitLeads.slice(0, 20),
        consultingIntake: intake.slice(0, 20),
        bookings:         bookings.slice(0, 20),
        scoreLeads:       scoreLeads.slice(0, 20),
        insiderSubs:      insiderSubs.slice(0, 20),
        marketHitch:      marketHitch.slice(0, 20),
        retailerAI:       retailerAI.slice(0, 20),
        retailerApps:     retailerApps.slice(0, 20),
      },
      funnel: {
        scoredThenKit:        [...paidKitEmails].filter(e => scoredEmails.has(e)).length,
        scoredThenConsulting: [...intakeEmails].filter(e => scoredEmails.has(e)).length,
        kitThenConsulting:    [...intakeEmails].filter(e => paidKitEmails.has(e)).length,
      },
      fetchedAt: new Date().toISOString(),
    }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      error: err?.message ?? String(err),
      type: err?.constructor?.name ?? 'unknown',
      stack: (err?.stack ?? '').slice(0, 400),
    }
  }
})
