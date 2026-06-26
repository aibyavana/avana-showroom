import { defineEventHandler, getCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const path = event.path ?? ''
  if (!path.startsWith('/admin')) return
  if (path.startsWith('/admin/login')) return

  const session = getCookie(event, 'admin_session')
  const env = (globalThis as any).__env__
  const token = env?.ADMIN_TOKEN ?? process.env.ADMIN_TOKEN
  if (token && session === token) return
  return sendRedirect(event, '/admin/login', 302)
})
