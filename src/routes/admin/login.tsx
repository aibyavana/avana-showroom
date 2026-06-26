import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AvanaLogo } from '@/components/AvanaLogo'

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
})

function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!pw || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: pw }).toString(),
      })
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
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <AvanaLogo size="header" style={{ width: 140, filter: 'brightness(0) invert(1)' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#B8902E' }}>
            Admin Access
          </p>
        </div>

        {error && (
          <p style={{
            marginBottom: '1.25rem', padding: '0.75rem 1rem',
            backgroundColor: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)',
            borderRadius: 4, fontSize: '0.8rem', color: '#FCA5A5', textAlign: 'center',
          }}>
            Incorrect password. Try again.
          </p>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#B8902E', marginBottom: '0.5rem',
          }}>
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
            style={{
              display: 'block', width: '100%', padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,144,46,0.3)',
              borderRadius: 4, color: '#F7F4EF', fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !pw}
          style={{
            display: 'block', width: '100%', padding: '0.8rem',
            backgroundColor: loading || !pw ? 'rgba(184,144,46,0.45)' : '#B8902E',
            border: 'none', borderRadius: 4,
            color: '#0A0A0F', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loading || !pw ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {loading ? 'Verifying…' : 'Enter'}
        </button>
      </div>
    </div>
  )
}
