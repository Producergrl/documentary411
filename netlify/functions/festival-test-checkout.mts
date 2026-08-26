import type { Context } from '@netlify/functions'
import Stripe from 'stripe'

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    return new Response('Payments are not configured.', { status: 503 })
  }

  const origin = context.site.url || new URL(req.url).origin
  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 100,
            product_data: {
              name: '90-Day Festival Strategy — TEST',
              description: 'Temporary $1 live checkout test for the 90-Day Festival Strategy PDF.',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/welcome-festival.html?test=1`,
      cancel_url: `${origin}/festival-strategy.html?test=cancelled`,
      metadata: { product: 'festival_strategy', purpose: 'temporary_live_test' },
    })

    if (!session.url) return new Response('Checkout URL unavailable.', { status: 500 })
    return Response.redirect(session.url, 303)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout could not be created.'
    return new Response(message, { status: 500 })
  }
}

export const config = {
  path: '/.netlify/functions/festival-test-checkout',
  method: 'GET',
}
