import { createFileRoute } from '@tanstack/react-router'
import { AvanaLogo } from '@/components/AvanaLogo'

export const Route = createFileRoute('/admin/login')({
  validateSearch: (s: Record<string, unknown>) => ({ error: s.error === '1' }),
  component: AdminLogin,
})

function AdminLogin() {
  const { error } = Route.useSearch()

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
        {/* Logo */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <AvanaLogo size="header" style={{ width: 140, filter: 'brightness(0) invert(1)' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#B8902E' }}>
            Admin Access
          </p>
        </div>

        {/* Error */}
        {error && (
          <p style={{
            marginBottom: '1.25rem', padding: '0.75rem 1rem',
            backgroundColor: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)',
            borderRadius: 4, fontSize: '0.8rem', color: '#FCA5A5', textAlign: 'center',
          }}>
            Incorrect password. Try again.
          </p>
        )}

        {/* Form */}
        <form action="/api/admin/login" method="POST">
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8902E', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              style={{
                display: 'block', width: '100%', padding: '0.75rem 1rem',
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,144,46,0.3)',
                borderRadius: 4, color: '#F7F4EF', fontSize: '0.95rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              display: 'block', width: '100%', padding: '0.8rem',
              backgroundColor: '#B8902E', border: 'none', borderRadius: 4,
              color: '#0A0A0F', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
