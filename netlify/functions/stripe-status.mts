import type { Context } from '@netlify/functions'
import Stripe from 'stripe'

export default async (_req: Request, _context: Context) => {
  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    return Response.json({
      configured: false,
      mode: null,
      stripeReachable: false,
      message: 'STRIPE_SECRET_KEY is not available to this deploy context.'
    }, { status: 503 })
  }

  const mode = secretKey.startsWith('sk_live_') ? 'live' : secretKey.startsWith('sk_test_') ? 'test' : 'unknown'

  try {
    const stripe = new Stripe(secretKey)
    await stripe.balance.retrieve()
    return Response.json({
      configured: true,
      mode,
      stripeReachable: true,
      message: 'Stripe is configured and reachable from this Netlify deploy.'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe rejected the configured key.'
    return Response.json({
      configured: true,
      mode,
      stripeReachable: false,
      message
    }, { status: 500 })
  }
}

export const config = {
  path: '/.netlify/functions/stripe-status',
  method: 'GET',
}
