import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchAdminData, PRICES } from '@/lib/admin-data'
import type { AdminData } from '@/lib/admin-data'

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    try {
      return await fetchAdminData()
    } catch (e) {
      if (e instanceof Error && e.message === 'Unauthorized') {
        throw redirect({ to: '/admin/login' })
      }
      throw e
    }
  },
  component: AdminDashboard,
})

// ── Tokens ────────────────────────────────────────────────────────────────────

const NOIR = '#0A0A0F'
const CREAM = '#F7F4EF'
const GOLD = '#B8902E'
const MUTED = 'rgba(247,244,239,0.45)'
const CARD_BG = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(184,144,46,0.15)'
const RED = '#EF4444'
const RED_BG = 'rgba(239,68,68,0.08)'
const RED_BORDER = 'rgba(239,68,68,0.3)'
const GREEN = '#22C55E'

const FONT = 'Arial, Helvetica, sans-serif'
const MONO = '"DM Mono", "Courier New", monospace'

// ── Format helpers ────────────────────────────────────────────────────────────

const fmt$ = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
const fmtTime = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short', hour12: false })
const fmtShort = (iso: string) => iso.slice(5, 10) // MM-DD

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: 'warn' | 'ok' }) {
  const borderColor = highlight === 'warn' ? RED_BORDER : highlight === 'ok' ? 'rgba(34,197,94,0.3)' : BORDER
  const valueBg = highlight === 'warn' ? RED : highlight === 'ok' ? GREEN : GOLD
  return (
    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${borderColor}`, borderRadius: 6, padding: '1.25rem 1.5rem' }}>
      <p style={{ fontFamily: FONT, fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.6rem' }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: '1.8rem', fontWeight: 700, color: highlight ? valueBg : CREAM, margin: '0 0 0.3rem', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: FONT, fontSize: '0.72rem', color: MUTED, margin: 0 }}>{sub}</p>}
    </div>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <h2 style={{ fontFamily: FONT, fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, margin: '0 0 1rem', borderBottom: `1px solid ${BORDER}`, paddingBottom: '0.6rem' }}>{title}</h2>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | null | undefined)[][] }) {
  const thStyle: React.CSSProperties = { fontFamily: FONT, fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
  const tdStyle: React.CSSProperties = { fontFamily: MONO, fontSize: '0.75rem', color: CREAM, padding: '0.55rem 0.75rem', borderBottom: `1px solid rgba(184,144,46,0.08)`, verticalAlign: 'top', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} style={{ ...tdStyle, color: MUTED, textAlign: 'center', padding: '1.5rem' }}>No records</td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                {row.map((cell, j) => <td key={j} style={tdStyle}>{cell ?? '—'}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

function IssueRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: RED_BG, border: `1px solid ${RED_BORDER}`, borderRadius: 6, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
      {children}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const data: AdminData = Route.useLoaderData()
  const [tab, setTab] = useState<string>('kits')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { metrics, opsIssues, revenueByDay, recent, funnel, fetchedAt } = data
  const hasOpsIssues = opsIssues.stuckKits.length > 0 || opsIssues.failedScores.length > 0 || opsIssues.stuckScores.length > 0

  const tabs = [
    { id: 'kits',        label: `Kits (${recent.kitLeads.length})` },
    { id: 'consulting',  label: `Consulting (${recent.consultingIntake.length})` },
    { id: 'bookings',    label: `Bookings (${recent.bookings.length})` },
    { id: 'scores',      label: `Scores (${recent.scoreLeads.length})` },
    { id: 'insider',     label: `Insider (${recent.insiderSubs.length})` },
    { id: 'mh',          label: `Market Hitch (${recent.marketHitch.length})` },
    { id: 'retailerAI',  label: `Retailer AI (${recent.retailerAI.length})` },
    { id: 'retailerApp', label: `Applications (${recent.retailerApps.length})` },
  ]

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: NOIR, color: CREAM, fontFamily: FONT }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>AVANA Admin</span>
          <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginLeft: '1.5rem' }}>Updated {fmtTime(fetchedAt)}</span>
        </div>
        <a href="/api/admin/logout" style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textDecoration: 'none', letterSpacing: '0.1em' }}>Log out</a>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* ── Ops Health ─────────────────────────────────────────────────────── */}
        {hasOpsIssues && (
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHead title="Action Required" />
            {opsIssues.stuckKits.map(k => (
              <IssueRow key={k.id}>
                <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: RED, fontWeight: 700, marginRight: '1rem' }}>KIT NOT DELIVERED</span>
                <span style={{ fontFamily: MONO, fontSize: '0.75rem', color: CREAM }}>{k.first_name} · {k.email}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginLeft: '1rem' }}>Paid {k.paid_at ? fmtDate(k.paid_at) : '?'} · Order {k.paypal_order_id ?? '—'}</span>
              </IssueRow>
            ))}
            {opsIssues.failedScores.map(s => (
              <IssueRow key={s.id}>
                <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: RED, fontWeight: 700, marginRight: '1rem' }}>SCORE FAILED</span>
                <span style={{ fontFamily: MONO, fontSize: '0.75rem', color: CREAM }}>{s.first_name} · {s.email}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginLeft: '1rem' }}>{s.store_url ?? '—'} · {fmtDate(s.created_at)}</span>
              </IssueRow>
            ))}
            {opsIssues.stuckScores.map(s => (
              <IssueRow key={s.id}>
                <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700, marginRight: '1rem' }}>SCORE STUCK</span>
                <span style={{ fontFamily: MONO, fontSize: '0.75rem', color: CREAM }}>{s.first_name} · {s.email}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginLeft: '1rem' }}>{s.store_url ?? '—'} · pending since {fmtTime(s.created_at)}</span>
              </IssueRow>
            ))}
          </section>
        )}

        {/* ── Revenue ────────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHead title="Revenue" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <Card label="Kit Sales" value={fmt$(metrics.kitRevenue)} sub={`${metrics.kitSales} orders × ${fmt$(PRICES.KIT)}`} highlight={metrics.kitStuck > 0 ? 'warn' : undefined} />
            <Card label="Booking Revenue" value={fmt$(metrics.bookingRevenue)} sub={`${metrics.bookingsPaid} paid bookings`} />
            <Card label="Total Revenue" value={fmt$(metrics.kitRevenue + metrics.bookingRevenue)} sub="Kit + bookings combined" highlight="ok" />
            {metrics.kitStuck > 0 && (
              <Card label="Kits Not Delivered" value={metrics.kitStuck} sub="Paid but kit_sent = false" highlight="warn" />
            )}
          </div>

          {/* Revenue chart — last 30 days */}
          {mounted && (
            <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '1.25rem' }}>
              <p style={{ fontFamily: FONT, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 1rem' }}>Revenue last 30 days</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,144,46,0.1)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fill: MUTED, fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: MUTED, fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={44} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16161F', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 11, fontFamily: MONO }}
                    labelStyle={{ color: GOLD }}
                    formatter={(v: number, name: string) => [fmt$(v), name === 'kit' ? 'Kit' : 'Booking']}
                  />
                  <Bar dataKey="kit" fill={GOLD} opacity={0.85} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="booking" fill="#34EACD" opacity={0.75} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, margin: '0.5rem 0 0', display: 'flex', gap: '1.5rem' }}>
                <span>■ <span style={{ color: GOLD }}>Kit</span></span>
                <span>■ <span style={{ color: '#34EACD' }}>Booking</span></span>
              </p>
            </div>
          )}
        </section>

        {/* ── Lead metrics ───────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHead title="Lead Counts" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
            <Card label="Score Requests" value={metrics.scoreRequests} sub={`${metrics.scoreByStatus.sent} sent · ${metrics.scoreByStatus.pending} pending · ${metrics.scoreByStatus.failed} failed`} highlight={metrics.scoreByStatus.failed > 0 || metrics.scoreStuck > 0 ? 'warn' : undefined} />
            <Card label="Consulting Inquiries" value={metrics.consultingInquiries} sub="intake form submissions" />
            <Card label="Insider Subscribers" value={metrics.insiderSubs} />
            <Card label="Market Hitch Waitlist" value={metrics.marketHitch} />
            <Card label="Retailer AI Waitlist" value={metrics.retailerAI} />
            <Card label="Retailer Applications" value={metrics.retailerApps} />
            <Card label="Total Leads" value={metrics.totalLeads} sub="across all forms" />
          </div>
        </section>

        {/* ── Funnel ─────────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHead title={`Funnel (email cross-reference)`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Card label="Scored → Bought Kit" value={funnel.scoredThenKit} sub="email in score_leads + paid kit" />
            <Card label="Scored → Consulting" value={funnel.scoredThenConsulting} sub="email in score_leads + intake form" />
            <Card label="Kit → Consulting" value={funnel.kitThenConsulting} sub="paid kit buyer + intake form" />
          </div>
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginTop: '0.75rem' }}>
            Cross-referenced by exact email match. Does not account for different email addresses from the same person.
          </p>
        </section>

        {/* ── Lead tables ────────────────────────────────────────────────────── */}
        <section>
          <SectionHead title="Recent Leads (last 20 per table)" />

          {/* Tab bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1.25rem' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em',
                  padding: '0.4rem 0.85rem', borderRadius: 4, border: `1px solid ${tab === t.id ? GOLD : BORDER}`,
                  backgroundColor: tab === t.id ? 'rgba(184,144,46,0.12)' : 'transparent',
                  color: tab === t.id ? GOLD : MUTED, cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tables */}
          {tab === 'kits' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Paid', 'Kit Sent', 'Order ID']}
              rows={recent.kitLeads.map(k => [
                fmtDate(k.created_at), k.first_name, k.email,
                k.paid ? `Yes ${k.paid_at ? fmtDate(k.paid_at) : ''}` : 'No',
                k.kit_sent ? 'Yes' : k.paid ? '⚠ No' : '—',
                k.paypal_order_id,
              ])}
            />
          )}
          {tab === 'consulting' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Brand', 'Website', 'Areas']}
              rows={recent.consultingIntake.map(r => [
                fmtDate(r.created_at), `${r.first_name} ${r.last_name}`, r.email,
                r.brand_name, r.website, r.areas,
              ])}
            />
          )}
          {tab === 'bookings' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Type', 'Duration', 'Amount', 'Paid', 'Slot']}
              rows={recent.bookings.map(b => [
                fmtDate(b.created_at), b.first_name, b.email,
                b.booking_type, `${b.duration_minutes}min`,
                fmt$(b.amount_cents / 100),
                b.paid ? `Yes ${b.paid_at ? fmtDate(b.paid_at) : ''}` : 'No',
                b.slot_time ? fmtTime(b.slot_time) : '—',
              ])}
            />
          )}
          {tab === 'scores' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Store URL', 'Type', 'Status']}
              rows={recent.scoreLeads.map(s => [
                fmtDate(s.created_at), s.first_name, s.email,
                s.store_url, s.type, s.score_status,
              ])}
            />
          )}
          {tab === 'insider' && (
            <Table
              headers={['Date', 'Email']}
              rows={recent.insiderSubs.map(s => [fmtDate(s.created_at), s.email])}
            />
          )}
          {tab === 'mh' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Company', 'Audience']}
              rows={recent.marketHitch.map(r => [fmtDate(r.created_at), r.name, r.email, r.company, r.audience])}
            />
          )}
          {tab === 'retailerAI' && (
            <Table
              headers={['Date', 'Name', 'Email']}
              rows={recent.retailerAI.map(r => [fmtDate(r.created_at), r.first_name, r.email])}
            />
          )}
          {tab === 'retailerApp' && (
            <Table
              headers={['Date', 'Name', 'Email', 'Store', 'Website', 'WhatsApp']}
              rows={recent.retailerApps.map(r => [
                fmtDate(r.created_at), `${r.first_name} ${r.last_name}`, r.email,
                r.store_name, r.website, r.whatsapp,
              ])}
            />
          )}
        </section>

      </div>
    </div>
  )
}
