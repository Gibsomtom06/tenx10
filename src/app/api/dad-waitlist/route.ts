import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  const { email, name, use_case } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('dad_waitlist').insert({ email, name, use_case })

  const alreadyExists = error?.code === '23505'
  if (error && !alreadyExists) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Welcome email to the person who signed up — expected, not clutter
  if (resend && !alreadyExists) {
    resend.emails.send({
      from: 'DAD <noreply@tenx10.co>',
      to: email,
      subject: "You're on the DAD waitlist",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#000;color:#fff;border-radius:12px">
          <div style="font-size:28px;font-weight:900;margin-bottom:8px">DAD</div>
          <p style="color:#999;font-size:13px;margin-bottom:24px">Digital Asset Declutterer</p>
          <h2 style="font-size:20px;margin-bottom:12px">You're on the list${name ? `, ${name.split(' ')[0]}` : ''}.</h2>
          <p style="color:#aaa;line-height:1.6">We're building DAD to autonomously organize your email, drives, and files across all your businesses. When early access opens, you'll be first to know.</p>
          <p style="color:#aaa;line-height:1.6;margin-top:16px">In the meantime — <a href="https://tenx10.co/dad" style="color:#fff">share the waitlist</a> with anyone drowning in digital clutter.</p>
          <p style="color:#555;font-size:12px;margin-top:32px">10 Research Group · Unsubscribe anytime</p>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({
    message: alreadyExists ? "You're already on the list!" : 'success'
  }, { status: 200 })
}
