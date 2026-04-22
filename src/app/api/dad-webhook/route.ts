import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const email = session.customer_email
    const customerId = session.customer as string

    if (email) {
      const supabase = await createServiceClient()

      // Mark as paid in waitlist
      await supabase.from('dad_waitlist').upsert(
        { email, stripe_customer_id: customerId, paid: true, paid_at: new Date().toISOString() },
        { onConflict: 'email' }
      )

      // Revenue data lives in Supabase + Stripe dashboard — no inbox clutter
    }
  }

  return NextResponse.json({ received: true })
}
