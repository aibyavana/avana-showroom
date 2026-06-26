import { defineEventHandler, readFormData, setCookie, getMethod, setResponseHeader, setResponseStatus } from 'h3'

// In-memory rate limiter — 5 wrong attempts per IP per 15 minutes → 429
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS  = 5
const WINDOW_MS     = 15 * 60 * 1000

function getClientIp(event: any): string {
  const h = event.node.req.headers
  return (
    (h['cf-connecting-ip'] as string) ||
    ((h['x-forwarded-for'] as string) ?? '').split(',')[0].trim() ||
    '0.0.0.0'
  )
}

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) { loginAttempts.delete(ip); return false }
  return entry.count >= MAX_ATTEMPTS
}

function recordFailure(ip: string): void {
  const now   = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count++
  }
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  if (getMethod(event) !== 'POST') return { ok: false }

  const ip = getClientIp(event)

  if (checkRateLimit(ip)) {
    setResponseStatus(event, 429)
    return { ok: false, rateLimited: true }
  }

  let password: string | null = null
  try {
    const form = await readFormData(event)
    password = form.get('password') as string | null
  } catch {
    return { ok: false }
  }

  const env     = (globalThis as any).__env__
  const adminPw = env?.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD
  const token   = env?.ADMIN_TOKEN   ?? process.env.ADMIN_TOKEN

  if (!adminPw || !token || !password || password !== adminPw) {
    recordFailure(ip)
    return { ok: false }
  }

  loginAttempts.delete(ip)
  setCookie(event, 'admin_session', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  })
  return { ok: true }
})
