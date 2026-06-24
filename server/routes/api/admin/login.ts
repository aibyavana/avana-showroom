import { defineEventHandler, readFormData, setCookie, sendRedirect, getMethod } from 'h3'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let password: string | null = null
  try {
    const form = await readFormData(event)
    password = form.get('password') as string | null
  } catch {
    await sendRedirect(event, '/admin/login?error=1', 302)
    return
  }

  const adminPw = process.env.ADMIN_PASSWORD
  const token = process.env.ADMIN_TOKEN

  if (!adminPw || !token || !password || password !== adminPw) {
    await sendRedirect(event, '/admin/login?error=1', 302)
    return
  }

  setCookie(event, 'admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  await sendRedirect(event, '/admin', 302)
})
