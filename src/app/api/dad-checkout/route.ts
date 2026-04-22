import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const PAYPAL_EMAIL = 'thomasevan.nalian@gmail.com'
const RETURN_URL = 'https://tenx10.co/dad?success=true'

// PayPal hosted subscription — no API keys needed, money goes straight to PayPal account
function buildPayPalUrl() {
  const params = new URLSearchParams({
    cmd: '_xclick-subscriptions',
    business: PAYPAL_EMAIL,
    item_name: 'DAD Early Access — Digital Asset Declutterer',
    a3: '19.00',       // recurring amount
    p3: '1',           // every 1...
    t3: 'M',           // ...month
    currency_code: 'USD',
    no_note: '1',
    return: RETURN_URL,
    cancel_return: 'https://tenx10.co/dad',
  })
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`
}

export async function POST(request: NextRequest) {
  const { email, name } = await request.json()

  // Save to waitlist before redirecting to PayPal
  if (email) {
    const supabase = await createServiceClient()
    await supabase.from('dad_waitlist').upsert(
      { email, name, paid: false },
      { onConflict: 'email' }
    ).catch(() => {})
  }

  return NextResponse.json({ url: buildPayPalUrl() })
}
