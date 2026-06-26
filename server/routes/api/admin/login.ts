import { defineEventHandler, readFormData, setCookie, getMethod, setResponseHeader } from 'h3'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  if (getMethod(event) !== 'POST') {
    return { ok: false }
  }

  let password: string | null = null
  try {
    const form = await readFormData(event)
    password = form.get('password') as string | null
  } catch {
    return { ok: false }
  }

  const env = (globalThis as any).__env__
  const adminPw = env?.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD
  const token = env?.ADMIN_TOKEN ?? process.env.ADMIN_TOKEN

  if (!adminPw || !token || !password || password !== adminPw) {
    return { ok: false }
  }

  setCookie(event, 'admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true }
})
