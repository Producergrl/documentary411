import type { Context } from '@netlify/functions'
import Stripe from 'stripe'

const TIERS = {
  question: {
    name: 'Ask a Pro — One Question',
    description: 'One specific question, written answer within 2 business days.',
    amount: 5000,
    mode: 'payment' as const,
  },
  consult: {
    name: 'Ask a Pro — Professional Consult (1 hour)',
    description: '60-minute one-on-one Zoom consult with pre-call prep and written follow-up.',
    amount: 50000,
    mode: 'payment' as const,
  },
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    return Response.json(
      { error: 'Payments are not yet configured. Set STRIPE_SECRET_KEY in Netlify environment variables.' },
      { status: 503 },
    )
  }

  let body: { tier?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const tier = body.tier && TIERS[body.tier as keyof typeof TIERS]
  if (!tier) {
    return Response.json({ error: 'Unknown tier' }, { status: 400 })
  }

  const origin = req.headers.get('origin') || context.site.url || new URL(req.url).origin
  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: tier.mode,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tier.amount,
            product_data: {
              name: tier.name,
              description: tier.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?ask=success&tier=${body.tier}`,
      cancel_url: `${origin}/?ask=cancelled#ask-a-pro`,
      metadata: { tier: body.tier as string },
    })

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout could not be created.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config = {
  path: '/.netlify/functions/create-checkout-session',
  method: 'POST',
}
