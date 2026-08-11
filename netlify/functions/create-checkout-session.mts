import type { Context } from '@netlify/functions'
import Stripe from 'stripe'

const TIERS = {
  question: {
    name: 'Ask a Pro — One Question',
    description: 'One specific question, written answer within 2 business days.',
    amount: 5000,
    mode: 'payment' as const,
    successPath: '/?ask=success&tier=question',
    cancelPath: '/?ask=cancelled#ask-a-pro',
  },
  consult: {
    name: 'Ask a Pro — Professional Consult (1 hour)',
    description: '60-minute one-on-one Zoom consult with pre-call prep and written follow-up.',
    amount: 50000,
    mode: 'payment' as const,
    successPath: '/?ask=success&tier=consult',
    cancelPath: '/?ask=cancelled#ask-a-pro',
  },
  'festival-strategy': {
    name: 'The 90-Day Festival Strategy',
    description: 'The complete 90-day festival preparation playbook for documentary and independent filmmakers.',
    amount: 9900,
    mode: 'payment' as const,
    successPath: '/welcome-festival.html?session_id={CHECKOUT_SESSION_ID}',
    cancelPath: '/festival-strategy.html?checkout=cancelled',
  },
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Netlify Functions v2 exposes runtime variables through Netlify.env.
  // process.env is retained as a safe fallback for compatibility.
  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return Response.json(
      { error: 'STRIPE_SECRET_KEY is not available to this deploy. Check the Netlify Deploy Previews value and Functions scope, then redeploy.' },
      { status: 503 },
    )
  }

  let body: { tier?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const tierKey = body.tier as keyof typeof TIERS
  const tier = body.tier && TIERS[tierKey]
  if (!tier) {
    return Response.json({ error: 'Unknown tier' }, { status: 400 })
  }

  const origin = req.headers.get('origin') || context.site.url || new URL(req.url).origin
  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: tier.mode,
      payment_method_types: ['card'],
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
      success_url: `${origin}${tier.successPath}`,
      cancel_url: `${origin}${tier.cancelPath}`,
      metadata: { tier: tierKey },
    })

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout could not be created.'
    return Response.json({ error: `Stripe checkout error: ${message}` }, { status: 500 })
  }
}

export const config = {
  path: '/.netlify/functions/create-checkout-session',
  method: 'POST',
}
