import { createServerFn } from '@tanstack/react-start'

// ── Price constants — change here to update everywhere ────────────────────────
export const PRICES = {
  KIT:        297,   // DIY Store Audit Kit
  DEPOSIT:    500,   // First call deposit (full value, credits toward engagement)
  CONSULT_30: 250,   // 30-min consulting session
  CONSULT_60: 500,   // 60-min consulting session
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KitLead {
  id: string; email: string; first_name: string; created_at: string
  paid: boolean; paid_at: string | null; kit_sent: boolean | null; paypal_order_id: string | null
}
export interface ConsultingIntake {
  id: string; email: string; first_name: string; last_name: string
  brand_name: string; website: string | null; whatsapp: string
  areas: string | null; message: string | null; created_at: string
}
export interface ConsultBooking {
  id: string; email: string; first_name: string; slot_time: string | null
  duration_minutes: number; amount_cents: number; booking_type: string
  paid: boolean; paid_at: string | null; paypal_order_id: string | null
  services: string[]; note: string | null; created_at: string
}
export interface ScoreLead {
  id: string; email: string; first_name: string; store_url: string | null
  type: string; score_status: string; created_at: string
}
export interface InsiderSub {
  id: string; email: string; created_at: string
}
export interface MarketHitchEntry {
  id: string; name: string; email: string; company: string; audience: string; created_at: string
}
export interface RetailerAIEntry {
  id: string; first_name: string; email: string; created_at: string
}
export interface RetailerApp {
  id: string; first_name: string; last_name: string; email: string
  store_name: string; website: string | null; whatsapp: string
  instagram: string | null; created_at: string
}

export interface RevenueDay {
  date: string  // YYYY-MM-DD
  kit: number   // USD
  booking: number // USD
}

export interface AdminData {
  metrics: {
    kitSales: number; kitRevenue: number; kitStuck: number
    bookingsPaid: number; bookingRevenue: number
    consultingInquiries: number
    scoreRequests: number; scoreByStatus: { pending: number; sent: number; failed: number }
    scoreStuck: number
    insiderSubs: number; marketHitch: number; retailerAI: number; retailerApps: number
    totalLeads: number
  }
  opsIssues: {
    stuckKits: KitLead[]
    failedScores: ScoreLead[]
    stuckScores: ScoreLead[]
  }
  revenueByDay: RevenueDay[]
  recent: {
    kitLeads: KitLead[]
    consultingIntake: ConsultingIntake[]
    bookings: ConsultBooking[]
    scoreLeads: ScoreLead[]
    insiderSubs: InsiderSub[]
    marketHitch: MarketHitchEntry[]
    retailerAI: RetailerAIEntry[]
    retailerApps: RetailerApp[]
  }
  funnel: {
    scoredThenKit: number
    scoredThenConsulting: number
    kitThenConsulting: number
  }
  fetchedAt: string
}

// ── Cookie auth helper ────────────────────────────────────────────────────────

function getAdminSession(cookieHeader: string): string {
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    if (part.slice(0, idx).trim() === 'admin_session') {
      return part.slice(idx + 1).trim()
    }
  }
  return ''
}

// ── Data grouping helpers ─────────────────────────────────────────────────────

function toDateStr(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}

function buildRevenueByDay(
  kitLeads: KitLead[],
  bookings: ConsultBooking[],
  days: number,
): RevenueDay[] {
  const now = new Date()
  const result: RevenueDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    result.push({ date: d.toISOString().slice(0, 10), kit: 0, booking: 0 })
  }
  const cutoff = result[0].date

  for (const k of kitLeads) {
    if (!k.paid || !k.paid_at) continue
    const day = toDateStr(k.paid_at)
    if (day < cutoff) continue
    const entry = result.find(r => r.date === day)
    if (entry) entry.kit += PRICES.KIT
  }
  for (const b of bookings) {
    if (!b.paid || !b.paid_at) continue
    const day = toDateStr(b.paid_at)
    if (day < cutoff) continue
    const entry = result.find(r => r.date === day)
    if (entry) entry.booking += b.amount_cents / 100
  }
  return result
}

// ── Server function ───────────────────────────────────────────────────────────

export const fetchAdminData = createServerFn({ method: 'GET' }).handler(async (): Promise<AdminData> => {
  // Defense-in-depth: verify cookie even though Nitro middleware already guards the page
  const { getRequest } = await import('@tanstack/react-start/server')
  const req = getRequest()
  const cookieHeader = req?.headers.get('cookie') ?? ''
  const session = getAdminSession(cookieHeader)
  const token = process.env.ADMIN_TOKEN
  if (!token || session !== token) {
    throw new Error('Unauthorized')
  }

  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[admin] Supabase admin creds not set')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Fetch all tables in parallel
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

  const kitLeads      = (kitRes.data ?? []) as KitLead[]
  const intake        = (intakeRes.data ?? []) as ConsultingIntake[]
  const bookings      = (bookingRes.data ?? []) as ConsultBooking[]
  const scoreLeads    = (scoreRes.data ?? []) as ScoreLead[]
  const insiderSubs   = (insiderRes.data ?? []) as InsiderSub[]
  const marketHitch   = (marketRes.data ?? []) as MarketHitchEntry[]
  const retailerAI    = (retailerAIRes.data ?? []) as RetailerAIEntry[]
  const retailerApps  = (retailerAppRes.data ?? []) as RetailerApp[]

  // ── Metrics ────────────────────────────────────────────────────────────────
  const paidKits     = kitLeads.filter(k => k.paid)
  const kitSales     = paidKits.length
  const kitRevenue   = kitSales * PRICES.KIT
  const kitStuck     = kitLeads.filter(k => k.paid && !k.kit_sent).length

  const paidBookings    = bookings.filter(b => b.paid)
  const bookingsPaid    = paidBookings.length
  const bookingRevenue  = paidBookings.reduce((s, b) => s + b.amount_cents / 100, 0)

  const scoreByStatus = {
    pending: scoreLeads.filter(s => s.score_status === 'pending').length,
    sent:    scoreLeads.filter(s => s.score_status === 'sent').length,
    failed:  scoreLeads.filter(s => s.score_status === 'failed').length,
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const stuckScoreRows = scoreLeads.filter(
    s => s.score_status === 'pending' && s.created_at < twoHoursAgo
  )

  // ── Ops issues ────────────────────────────────────────────────────────────
  const stuckKits   = kitLeads.filter(k => k.paid && !k.kit_sent)
  const failedScores = scoreLeads.filter(s => s.score_status === 'failed')

  // ── Funnel cross-reference by email ───────────────────────────────────────
  const scoredEmails = new Set(scoreLeads.map(s => s.email.toLowerCase()))
  const paidKitEmails = new Set(paidKits.map(k => k.email.toLowerCase()))
  const intakeEmails  = new Set(intake.map(i => i.email.toLowerCase()))

  const scoredThenKit        = [...paidKitEmails].filter(e => scoredEmails.has(e)).length
  const scoredThenConsulting = [...intakeEmails].filter(e => scoredEmails.has(e)).length
  const kitThenConsulting    = [...intakeEmails].filter(e => paidKitEmails.has(e)).length

  // ── Revenue by day (last 30 days) ─────────────────────────────────────────
  const revenueByDay = buildRevenueByDay(kitLeads, bookings, 30)

  const totalLeads = kitLeads.length + intake.length + bookings.length +
    scoreLeads.length + insiderSubs.length + marketHitch.length +
    retailerAI.length + retailerApps.length

  return {
    metrics: {
      kitSales, kitRevenue, kitStuck,
      bookingsPaid, bookingRevenue,
      consultingInquiries: intake.length,
      scoreRequests: scoreLeads.length, scoreByStatus, scoreStuck: stuckScoreRows.length,
      insiderSubs: insiderSubs.length, marketHitch: marketHitch.length,
      retailerAI: retailerAI.length, retailerApps: retailerApps.length,
      totalLeads,
    },
    opsIssues: {
      stuckKits,
      failedScores,
      stuckScores: stuckScoreRows,
    },
    revenueByDay,
    recent: {
      kitLeads:        kitLeads.slice(0, 20),
      consultingIntake: intake.slice(0, 20),
      bookings:        bookings.slice(0, 20),
      scoreLeads:      scoreLeads.slice(0, 20),
      insiderSubs:     insiderSubs.slice(0, 20),
      marketHitch:     marketHitch.slice(0, 20),
      retailerAI:      retailerAI.slice(0, 20),
      retailerApps:    retailerApps.slice(0, 20),
    },
    funnel: { scoredThenKit, scoredThenConsulting, kitThenConsulting },
    fetchedAt: new Date().toISOString(),
  }
})
