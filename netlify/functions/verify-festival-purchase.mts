import type { Context } from '@netlify/functions'
import Stripe from 'stripe'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return Response.json({ error: 'STRIPE_SECRET_KEY is not available to this deploy.' }, { status: 503 })
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id')
  if (!sessionId) {
    return Response.json({ paid: false, error: 'Missing checkout session.' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const isFestivalStrategy = session.metadata?.tier === 'festival-strategy'
    const isPaid = session.payment_status === 'paid'

    if (!isFestivalStrategy || !isPaid) {
      return Response.json({ paid: false }, { status: 403 })
    }

    return Response.json({
      paid: true,
      email: session.customer_details?.email || null,
      amountTotal: session.amount_total || null,
      currency: session.currency || 'usd',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to verify this checkout session.'
    return Response.json({ paid: false, error: message }, { status: 400 })
  }
}

export const config = {
  path: '/.netlify/functions/verify-festival-purchase',
  method: 'GET',
}
