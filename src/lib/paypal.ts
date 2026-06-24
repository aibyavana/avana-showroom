import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { fulfillKit } from './kit-fulfillment'

function paypalBase(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) throw new Error('[paypal] PAYPAL_CLIENT_ID or PAYPAL_SECRET not set')

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`[paypal] Token fetch failed: ${res.status}`)
  const json = await res.json() as { access_token: string }
  return json.access_token
}

export const createPayPalOrder = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const s = z.object({ leadId: z.string().min(1) })
    return s.parse(raw)
  })
  .handler(async ({ data }): Promise<{ orderId: string }> => {
    const token = await getAccessToken()
    const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: '297.00' },
          description: 'AVANA DIY Store Audit Kit',
          custom_id: data.leadId,
        }],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`[paypal] Create order failed ${res.status}: ${body}`)
    }
    const order = await res.json() as { id: string }
    return { orderId: order.id }
  })

export const capturePayPalOrder = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => {
    const s = z.object({ orderId: z.string().min(1), leadId: z.string().min(1) })
    return s.parse(raw)
  })
  .handler(async ({ data }): Promise<{ captured: boolean; email: string }> => {
    const token = await getAccessToken()
    const res = await fetch(`${paypalBase()}/v2/checkout/orders/${data.orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`[paypal] Capture failed ${res.status}: ${body}`)
    }
    const capture = await res.json() as { status: string; id: string }
    if (capture.status !== 'COMPLETED') {
      throw new Error(`[paypal] Capture status not COMPLETED: ${capture.status}`)
    }

    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('[paypal] Supabase admin creds not set')
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: lead, error } = await admin
      .from('audit_kit_leads')
      .select('email, first_name')
      .eq('id', data.leadId)
      .single()

    if (error || !lead) throw new Error(`[paypal] Lead not found: ${data.leadId}`)

    await fulfillKit({
      leadId: data.leadId,
      paypalOrderId: capture.id,
      email: lead.email,
      firstName: lead.first_name,
    })

    return { captured: true, email: lead.email }
  })
