import { defineEventHandler, deleteCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  deleteCookie(event, 'admin_session', { path: '/' })
  await sendRedirect(event, '/admin/login', 302)
})
