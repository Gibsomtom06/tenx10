import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// $19/mo early access — update STRIPE_PRICE_ID in env once created in Stripe dashboard
const PRICE_ID = process.env.STRIPE_DAD_PRICE_ID

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const { email } = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email || undefined,
    line_items: PRICE_ID
      ? [{ price: PRICE_ID, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DAD — Early Access',
              description: 'Digital Asset Declutterer: autonomous AI for your email, drives & files',
            },
            unit_amount: 1900, // $19.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dad?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dad`,
    metadata: { product: 'dad_early_access' },
  })

  return NextResponse.json({ url: session.url })
}
