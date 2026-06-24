import { defineEventHandler, getCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const path = event.path ?? ''

  // Only guard /admin routes
  if (!path.startsWith('/admin')) return

  // Allow the login page and admin API routes through
  if (
    path === '/admin/login' ||
    path.startsWith('/admin/login?') ||
    path.startsWith('/api/admin/')
  ) return

  const session = getCookie(event, 'admin_session')
  const token = process.env.ADMIN_TOKEN

  if (!token || session !== token) {
    await sendRedirect(event, '/admin/login', 302)
  }
})
