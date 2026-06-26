import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AvanaLogo } from '@/components/AvanaLogo'

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
})

const THEMES = {
  dark: {
    bg:      '#0A0A0F',
    text:    '#F7F4EF',
    gold:    '#B8902E',
    muted:   'rgba(247,244,239,0.55)',
    border:  'rgba(184,144,46,0.3)',
    inputBg: 'rgba(255,255,255,0.04)',
    errBg:   'rgba(220,38,38,0.12)',
    errBdr:  'rgba(220,38,38,0.35)',
    errText: '#FCA5A5',
    btnBg:   '#B8902E',
    btnDis:  'rgba(184,144,46,0.45)',
    logoFilter: 'brightness(0) invert(1)',
  },
  light: {
    bg:      '#F7F4EF',
    text:    '#0A0A0F',
    gold:    '#8C6A1A',
    muted:   'rgba(10,10,15,0.55)',
    border:  'rgba(140,106,26,0.35)',
    inputBg: 'rgba(10,10,15,0.04)',
    errBg:   'rgba(220,38,38,0.07)',
    errBdr:  'rgba(220,38,38,0.28)',
    errText: '#DC2626',
    btnBg:   '#8C6A1A',
    btnDis:  'rgba(140,106,26,0.40)',
    logoFilter: 'none',
  },
}
type ThemeKey = keyof typeof THEMES

function AdminLogin() {
  const [pw, setPw]               = useState('')
  const [error, setError]         = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [theme, setTheme]         = useState<ThemeKey>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('admin_theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  const t = THEMES[theme]

  async function handleLogin() {
    if (!pw || loading) return
    setLoading(true)
    setError(false)
    setRateLimited(false)
    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({ password: pw }).toString(),
      })
      if (res.status === 429) {
        setRateLimited(true)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.ok) {
        window.location.href = '/admin'
      } else {
        setError(true)
        setLoading(false)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="admin-cursor" style={{
      minHeight: '100dvh',
      backgroundColor: t.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <AvanaLogo size="header" style={{ width: 140, filter: t.logoFilter }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: t.gold }}>
            Admin Access
          </p>
        </div>

        {rateLimited && (
          <p style={{
            marginBottom: '1.25rem', padding: '0.75rem 1rem',
            backgroundColor: t.errBg, border: `1px solid ${t.errBdr}`,
            borderRadius: 4, fontSize: '0.8rem', color: t.errText, textAlign: 'center',
          }}>
            Too many attempts. Try again in 15 minutes.
          </p>
        )}

        {error && !rateLimited && (
          <p style={{
            marginBottom: '1.25rem', padding: '0.75rem 1rem',
            backgroundColor: t.errBg, border: `1px solid ${t.errBdr}`,
            borderRadius: 4, fontSize: '0.8rem', color: t.errText, textAlign: 'center',
          }}>
            Incorrect password. Try again.
          </p>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: t.gold, marginBottom: '0.5rem',
          }}>
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
            disabled={rateLimited}
            style={{
              display: 'block', width: '100%', padding: '0.75rem 1rem',
              backgroundColor: t.inputBg, border: `1px solid ${t.border}`,
              borderRadius: 4, color: t.text, fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box',
              fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !pw || rateLimited}
          style={{
            display: 'block', width: '100%', padding: '0.8rem',
            backgroundColor: loading || !pw || rateLimited ? t.btnDis : t.btnBg,
            border: 'none', borderRadius: 4,
            color: theme === 'dark' ? '#0A0A0F' : '#F7F4EF',
            fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loading || !pw || rateLimited ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
            fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
          }}
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </div>
    </div>
  )
}
