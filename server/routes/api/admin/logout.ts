import { defineEventHandler, setCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  setCookie(event, 'admin_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return sendRedirect(event, '/admin/login', 302)
})
