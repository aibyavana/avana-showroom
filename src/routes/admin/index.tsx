import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, createContext, useContext } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const PRICES = { KIT: 297 }

// ── Theme system ───────────────────────────────────────────────────────────────
type ThemeTokens = {
  bg: string; surface: string; border: string; borderG: string
  text: string; muted: string; gold: string
  font: string; mono: string
  red: string; redBg: string; redBdr: string
  amber: string; green: string; cardBg: string
  ttBg: string; gridLine: string; stripOdd: string
}

const THEMES: Record<'dark' | 'light', ThemeTokens> = {
  dark: {
    bg:       '#0A0A0F',
    surface:  '#111118',
    border:   'rgba(255,255,255,0.07)',
    borderG:  'rgba(184,144,46,0.15)',
    text:     '#F7F4EF',
    muted:    'rgba(247,244,239,0.45)',
    gold:     '#B8902E',
    font:     "'Archivo', Arial, Helvetica, sans-serif",
    mono:     '"DM Mono", "Courier New", monospace',
    red:      '#EF4444',
    redBg:    'rgba(239,68,68,0.08)',
    redBdr:   'rgba(239,68,68,0.30)',
    amber:    '#F59E0B',
    green:    '#22C55E',
    cardBg:   'rgba(255,255,255,0.04)',
    ttBg:     '#16161F',
    gridLine: 'rgba(184,144,46,0.10)',
    stripOdd: 'rgba(255,255,255,0.015)',
  },
  light: {
    bg:       '#F7F4EF',
    surface:  '#FFFFFF',
    border:   'rgba(10,10,15,0.10)',
    borderG:  'rgba(184,144,46,0.22)',
    text:     '#0A0A0F',
    muted:    'rgba(10,10,15,0.50)',
    gold:     '#8C6A1A',
    font:     "'Archivo', Arial, Helvetica, sans-serif",
    mono:     '"DM Mono", "Courier New", monospace',
    red:      '#DC2626',
    redBg:    'rgba(220,38,38,0.07)',
    redBdr:   'rgba(220,38,38,0.25)',
    amber:    '#D97706',
    green:    '#16A34A',
    cardBg:   'rgba(10,10,15,0.03)',
    ttBg:     '#EDE9E0',
    gridLine: 'rgba(10,10,15,0.08)',
    stripOdd: 'rgba(10,10,15,0.02)',
  },
}
type ThemeKey = keyof typeof THEMES

const ThemeCtx = createContext<ThemeTokens>(THEMES.dark)
const useT = () => useContext(ThemeCtx)

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsDay { date: string; visitors: number; pageViews: number }
interface Analytics {
  today: { visitors: number; pageViews: number }
  week:  { visitors: number; pageViews: number }
  month: { visitors: number; pageViews: number }
  byDay: AnalyticsDay[]
}
interface AdminData {
  metrics: {
    kitSales: number; kitRevenue: number; kitStuck: number
    bookingsPaid: number; bookingRevenue: number
    consultingInquiries: number
    scoreRequests: number; scoreByStatus: { pending: number; sent: number; failed: number }
    scoreStuck: number
    insiderSubs: number; marketHitch: number; retailerAI: number; retailerApps: number
    totalLeads: number
  }
  opsIssues: { stuckKits: any[]; failedScores: any[]; stuckScores: any[] }
  revenueByDay: { date: string; kit: number; booking: number }[]
  recent: {
    kitLeads: any[]; consultingIntake: any[]; bookings: any[]; scoreLeads: any[]
    insiderSubs: any[]; marketHitch: any[]; retailerAI: any[]; retailerApps: any[]
  }
  funnel: { scoredThenKit: number; scoredThenConsulting: number; kitThenConsulting: number }
  analytics: Analytics | null
  fetchedAt: string
}

// ── Route ──────────────────────────────────────────────────────────────────────
export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

// ── Format helpers ─────────────────────────────────────────────────────────────
const fmt$     = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
const fmtTime  = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short', hour12: false })
const fmtShort = (iso: string) => iso.slice(5, 10)

// ── Sub-components (use ThemeCtx) ──────────────────────────────────────────────
function Card({ label, value, sub, highlight, onClick, active }: { label: string; value: string | number; sub?: string; highlight?: 'warn' | 'ok'; onClick?: () => void; active?: boolean }) {
  const t = useT()
  const borderColor = active ? t.gold : highlight === 'warn' ? t.redBdr : highlight === 'ok' ? 'rgba(34,197,94,0.3)' : t.borderG
  const valueColor  = highlight === 'warn' ? t.red : highlight === 'ok' ? t.green : t.text
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: active ? 'rgba(184,144,46,0.08)' : t.cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 6, padding: '1.25rem 1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      <p style={{ fontFamily: t.font, fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: active ? t.gold : t.gold, margin: '0 0 0.6rem' }}>{label}</p>
      <p style={{ fontFamily: t.mono, fontSize: '1.8rem', fontWeight: 700, color: valueColor, margin: '0 0 0.3rem', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: t.font, fontSize: '0.72rem', color: t.muted, margin: 0 }}>{sub}</p>}
      {onClick && <p style={{ fontFamily: t.mono, fontSize: '0.58rem', color: active ? t.gold : t.muted, margin: '0.5rem 0 0', letterSpacing: '0.12em' }}>{active ? '▼ viewing' : '▶ click to view'}</p>}
    </div>
  )
}

function SectionHead({ title }: { title: string }) {
  const t = useT()
  return (
    <h2 style={{ fontFamily: t.font, fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: t.gold, margin: '0 0 1rem', borderBottom: `1px solid ${t.borderG}`, paddingBottom: '0.6rem' }}>{title}</h2>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | null | undefined)[][] }) {
  const t = useT()
  const th: React.CSSProperties = { fontFamily: t.font, fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.gold, padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: `1px solid ${t.borderG}`, whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { fontFamily: t.mono, fontSize: '0.75rem', color: t.text, padding: '0.55rem 0.75rem', borderBottom: `1px solid rgba(184,144,46,0.08)`, verticalAlign: 'top', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{headers.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} style={{ ...td, color: t.muted, textAlign: 'center', padding: '1.5rem' }}>No records</td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : t.stripOdd }}>
                {row.map((cell, j) => <td key={j} style={td}>{cell ?? '—'}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

function IssueRow({ children }: { children: React.ReactNode }) {
  const t = useT()
  return (
    <div style={{ backgroundColor: t.redBg, border: `1px solid ${t.redBdr}`, borderRadius: 6, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
      {children}
    </div>
  )
}

// ── Theme toggle icons ──────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [data, setData]       = useState<AdminData | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('kits')
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme]     = useState<ThemeKey>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('admin_theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
    setMounted(true)
    fetch('/api/admin/data')
      .then(res => {
        if (res.status === 401) { window.location.href = '/admin/login'; return null }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => { if (json) setData(json) })
      .catch(e => setLoadErr(String(e?.message ?? e)))
  }, [])

  const t = THEMES[theme]

  function toggleTheme() {
    const next: ThemeKey = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('admin_theme', next)
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: t.mono, color: loadErr ? t.red : t.muted, fontSize: '0.85rem' }}>
          {loadErr ? `Error: ${loadErr}` : 'Loading...'}
        </p>
      </div>
    )
  }

  const { metrics, opsIssues, revenueByDay, recent, funnel, analytics, fetchedAt } = data
  const hasOps = opsIssues.stuckKits.length > 0 || opsIssues.failedScores.length > 0 || opsIssues.stuckScores.length > 0

  const leadCards = [
    { id: 'scores',      label: 'Score Requests',        value: metrics.scoreRequests,       sub: `${metrics.scoreByStatus.sent} sent · ${metrics.scoreByStatus.pending} pending · ${metrics.scoreByStatus.failed} failed`, highlight: (metrics.scoreByStatus.failed > 0 || metrics.scoreStuck > 0) ? 'warn' as const : undefined },
    { id: 'consulting',  label: 'Consulting Inquiries',  value: metrics.consultingInquiries, sub: 'intake form submissions' },
    { id: 'kits',        label: 'Kit Leads',             value: recent.kitLeads.length,      sub: `${recent.kitLeads.filter((k: any) => k.paid).length} paid`, highlight: opsIssues.stuckKits.length > 0 ? 'warn' as const : undefined },
    { id: 'bookings',    label: 'Bookings',              value: recent.bookings.length,      sub: `${recent.bookings.filter((b: any) => b.paid).length} paid` },
    { id: 'insider',     label: 'Insider Subscribers',   value: metrics.insiderSubs },
    { id: 'mh',          label: 'Market Hitch Waitlist', value: metrics.marketHitch },
    { id: 'retailerAI',  label: 'Retailer AI Waitlist',  value: metrics.retailerAI },
    { id: 'retailerApp', label: 'Retailer Applications', value: metrics.retailerApps },
  ]

  return (
    <ThemeCtx.Provider value={t}>
      <div className="admin-cursor" style={{ minHeight: '100dvh', backgroundColor: t.bg, color: t.text, fontFamily: t.font }}>

        {/* Header */}
        <div style={{ borderBottom: `1px solid ${t.borderG}`, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontFamily: t.mono, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold }}>AVANA Admin</span>
            <span style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, marginLeft: '1.5rem' }}>Updated {fmtTime(fetchedAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: t.mono, fontSize: '0.62rem', letterSpacing: '0.1em',
                color: t.muted, background: 'none', border: `1px solid ${t.border}`,
                borderRadius: 4, padding: '0.3rem 0.65rem', cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <a href="/api/admin/logout" style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, textDecoration: 'none', letterSpacing: '0.1em' }}>Log out</a>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

          {/* Analytics */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHead title="Website Analytics — last 30 days" />
            {!analytics ? (
              <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderG}`, borderRadius: 6, padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: t.mono, fontSize: '0.75rem', color: t.muted, margin: 0 }}>
                  Analytics not configured.{' '}
                  <span style={{ color: t.gold }}>
                    Add CF_ZONE_ID and CF_API_TOKEN as Worker secrets to enable visitor tracking.
                  </span>
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <Card label="Today — Page Views"      value={analytics.today.visitors.toLocaleString()}  sub="HTML page loads today" />
                  <Card label="This Week — Page Views"  value={analytics.week.visitors.toLocaleString()}   sub="HTML page loads this week" />
                  <Card label="This Month — Page Views" value={analytics.month.visitors.toLocaleString()}  sub="HTML page loads this month" />
                </div>
                {mounted && analytics.byDay.length > 0 && (
                  <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderG}`, borderRadius: 6, padding: '1.25rem' }}>
                    <p style={{ fontFamily: t.font, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, margin: '0 0 1rem' }}>Daily page views</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analytics.byDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={10}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.gridLine} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fill: t.muted, fontSize: 9, fontFamily: t.mono }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: t.muted, fontSize: 9, fontFamily: t.mono }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip
                          contentStyle={{ backgroundColor: t.ttBg, border: `1px solid ${t.borderG}`, borderRadius: 4, fontSize: 11, fontFamily: t.mono }}
                          labelStyle={{ color: t.gold }}
                          formatter={(v: number) => [v.toLocaleString(), 'Visitors']}
                        />
                        <Bar dataKey="visitors" fill={t.gold} opacity={0.85} radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Action Required */}
          {hasOps && (
            <section style={{ marginBottom: '2.5rem' }}>
              <SectionHead title="Action Required" />
              {opsIssues.stuckKits.map((k: any) => (
                <IssueRow key={k.id}>
                  <span style={{ fontFamily: t.mono, fontSize: '0.7rem', color: t.red, fontWeight: 700, marginRight: '1rem' }}>KIT NOT DELIVERED</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.75rem', color: t.text }}>{k.first_name} · {k.email}</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, marginLeft: '1rem' }}>Paid {k.paid_at ? fmtDate(k.paid_at) : '?'} · Order {k.paypal_order_id ?? '—'}</span>
                </IssueRow>
              ))}
              {opsIssues.failedScores.map((s: any) => (
                <IssueRow key={s.id}>
                  <span style={{ fontFamily: t.mono, fontSize: '0.7rem', color: t.red, fontWeight: 700, marginRight: '1rem' }}>SCORE FAILED</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.75rem', color: t.text }}>{s.first_name} · {s.email}</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, marginLeft: '1rem' }}>{s.store_url ?? '—'} · {fmtDate(s.created_at)}</span>
                </IssueRow>
              ))}
              {opsIssues.stuckScores.map((s: any) => (
                <IssueRow key={s.id}>
                  <span style={{ fontFamily: t.mono, fontSize: '0.7rem', color: t.amber, fontWeight: 700, marginRight: '1rem' }}>SCORE STUCK</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.75rem', color: t.text }}>{s.first_name} · {s.email}</span>
                  <span style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, marginLeft: '1rem' }}>pending since {fmtTime(s.created_at)}</span>
                </IssueRow>
              ))}
            </section>
          )}

          {/* Lead Command Center */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHead title="Leads" />

            {/* Clickable cards — click any to view records inline below */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {leadCards.map(card => (
                <Card
                  key={card.id}
                  label={card.label}
                  value={card.value}
                  sub={card.sub}
                  highlight={card.highlight}
                  active={activeTab === card.id}
                  onClick={() => setActiveTab(card.id)}
                />
              ))}
              <Card label="Total Leads" value={metrics.totalLeads} sub="across all forms" />
            </div>

            {/* Inline records panel */}
            <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderG}`, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderBottom: `1px solid ${t.borderG}` }}>
                <span style={{ fontFamily: t.font, fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold }}>
                  {leadCards.find(c => c.id === activeTab)?.label ?? activeTab} — most recent 20
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {leadCards.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveTab(c.id)}
                      title={c.label}
                      style={{
                        fontFamily: t.mono, fontSize: '0.58rem', letterSpacing: '0.08em',
                        padding: '0.25rem 0.55rem', borderRadius: 3,
                        border: `1px solid ${activeTab === c.id ? t.gold : t.border}`,
                        backgroundColor: activeTab === c.id ? 'rgba(184,144,46,0.12)' : 'transparent',
                        color: activeTab === c.id ? t.gold : t.muted, cursor: 'pointer',
                      }}
                    >
                      {c.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '0.25rem 0' }}>
                {activeTab === 'scores' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Store URL', 'Type', 'Status']}
                    rows={recent.scoreLeads.map((s: any) => [fmtDate(s.created_at), s.first_name, s.email, s.store_url, s.type, s.score_status])}
                  />
                )}
                {activeTab === 'consulting' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Brand', 'Website', 'Areas']}
                    rows={recent.consultingIntake.map((r: any) => [fmtDate(r.created_at), `${r.first_name} ${r.last_name}`, r.email, r.brand_name, r.website, r.areas])}
                  />
                )}
                {activeTab === 'kits' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Paid', 'Kit Sent', 'Order ID']}
                    rows={recent.kitLeads.map((k: any) => [fmtDate(k.created_at), k.first_name, k.email, k.paid ? `Yes ${k.paid_at ? fmtDate(k.paid_at) : ''}` : 'No', k.kit_sent ? 'Yes' : k.paid ? 'No' : '—', k.paypal_order_id])}
                  />
                )}
                {activeTab === 'bookings' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Type', 'Duration', 'Amount', 'Paid', 'Slot']}
                    rows={recent.bookings.map((b: any) => [fmtDate(b.created_at), b.first_name, b.email, b.booking_type, `${b.duration_minutes}min`, fmt$(b.amount_cents / 100), b.paid ? `Yes ${b.paid_at ? fmtDate(b.paid_at) : ''}` : 'No', b.slot_time ? fmtTime(b.slot_time) : '—'])}
                  />
                )}
                {activeTab === 'insider' && (
                  <DataTable
                    headers={['Date', 'Email']}
                    rows={recent.insiderSubs.map((s: any) => [fmtDate(s.created_at), s.email])}
                  />
                )}
                {activeTab === 'mh' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Company', 'Audience']}
                    rows={recent.marketHitch.map((r: any) => [fmtDate(r.created_at), r.name, r.email, r.company, r.audience])}
                  />
                )}
                {activeTab === 'retailerAI' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email']}
                    rows={recent.retailerAI.map((r: any) => [fmtDate(r.created_at), r.first_name, r.email])}
                  />
                )}
                {activeTab === 'retailerApp' && (
                  <DataTable
                    headers={['Date', 'Name', 'Email', 'Store', 'Website', 'WhatsApp']}
                    rows={recent.retailerApps.map((r: any) => [fmtDate(r.created_at), `${r.first_name} ${r.last_name}`, r.email, r.store_name, r.website, r.whatsapp])}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Funnel */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHead title="Funnel (email cross-reference)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card label="Scored then Bought Kit"   value={funnel.scoredThenKit}        sub="email in score_leads + paid kit" />
              <Card label="Scored then Consulting"   value={funnel.scoredThenConsulting} sub="email in score_leads + intake form" />
              <Card label="Kit then Consulting"      value={funnel.kitThenConsulting}    sub="paid kit buyer + intake form" />
            </div>
            <p style={{ fontFamily: t.mono, fontSize: '0.65rem', color: t.muted, marginTop: '0.75rem' }}>
              Cross-referenced by exact email match.
            </p>
          </section>

        </div>
      </div>
    </ThemeCtx.Provider>
  )
}
