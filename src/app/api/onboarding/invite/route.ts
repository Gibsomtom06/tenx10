import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tenx10.co'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artistId, artistEmail, artistName, managerName } = await request.json()
  if (!artistId || !artistEmail) {
    return NextResponse.json({ error: 'artistId and artistEmail required' }, { status: 400 })
  }

  const service = await createServiceClient()

  // Upsert invite — one active invite per artist
  const { data: invite, error: inviteErr } = await service
    .from('artist_invites')
    .upsert({
      artist_id: artistId,
      manager_id: user.id,
      email: artistEmail,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
    }, { onConflict: 'artist_id', ignoreDuplicates: false })
    .select('token')
    .single()

  if (inviteErr || !invite) {
    return NextResponse.json({ error: inviteErr?.message ?? 'Failed to create invite' }, { status: 500 })
  }

  const joinUrl = `${BASE_URL}/artist/join/${invite.token}`
  const from = managerName ?? 'Your Manager'
  const firstName = artistName?.split(' ')[0] ?? artistName ?? 'there'

  if (!resend) {
    return NextResponse.json({ ok: true, joinUrl, warning: 'RESEND_API_KEY not set — email not sent. Use the join URL directly.' })
  }

  const { error: emailErr } = await resend.emails.send({
    from: 'TENx10 <noreply@tenx10.co>',
    to: artistEmail,
    subject: `${from} invited you to TENx10`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#0a0a0a;color:#fff;border-radius:16px">
        <div style="font-size:11px;letter-spacing:0.1em;color:#666;text-transform:uppercase;margin-bottom:24px">tenx10 · artist management platform</div>

        <h1 style="font-size:28px;font-weight:900;margin:0 0 16px;line-height:1.1">
          ${from} added you to TENx10.
        </h1>

        <p style="color:#999;font-size:15px;line-height:1.6;margin:0 0 24px">
          Hey ${firstName} — your management team is running on TENx10 now.
          It's where your bookings, streaming data, and touring calendar all live.
          Takes about 2 minutes to get your artist profile set up.
        </p>

        <a href="${joinUrl}" style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:32px">
          Set up my artist profile →
        </a>

        <div style="border-top:1px solid #222;padding-top:24px;margin-top:8px">
          <p style="color:#555;font-size:13px;margin:0 0 8px">What you'll do in TENx10:</p>
          <ul style="color:#666;font-size:13px;line-height:1.8;margin:0;padding-left:18px">
            <li>See your upcoming shows and advance checklists</li>
            <li>Track your streaming numbers and Popularity Score</li>
            <li>Get your daily briefing from Xai, your AI manager</li>
            <li>Message your management team directly</li>
          </ul>
        </div>

        <p style="color:#444;font-size:12px;margin:32px 0 0">
          This invite link expires in 7 days. Questions? Reply to this email or reach ${from} directly.<br/>
          <a href="${joinUrl}" style="color:#666;word-break:break-all">${joinUrl}</a>
        </p>
      </div>
    `,
  })

  if (emailErr) {
    return NextResponse.json({ ok: true, joinUrl, warning: `Invite created but email failed: ${emailErr.message}` })
  }

  return NextResponse.json({ ok: true, joinUrl, emailSent: true })
}
