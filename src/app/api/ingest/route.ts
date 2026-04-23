/**
 * /api/ingest
 * Web-facing entry point for the 7-agent ingest conversation.
 * Delegates all logic to src/lib/ingest/core.ts so every platform
 * (Discord, WhatsApp, Slack, SMS, Messenger) runs identical logic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'
import type { IngestState, ArtistData, Message } from '@/lib/ingest/core'

export type { IngestPhase, IngestState, ArtistData } from '@/lib/ingest/core'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      message: string
      history: Message[]
      state: IngestState
      sessionId?: string
    }

    const state: IngestState = body.state ?? {
      phase: 'intro',
      artistData: {} as ArtistData,
      researchComplete: false,
    }

    const output = await runIngest({
      message: body.message ?? '',
      history: body.history ?? [],
      state,
      sessionKey: body.sessionId ? 'web:' + body.sessionId : undefined,
    })

    return NextResponse.json({
      reply: output.reply,
      state: output.state,
      sessionId: body.sessionId,
      history: output.history,
    })
  } catch (err) {
    console.error('[/api/ingest]', err)
    return NextResponse.json({ error: 'Ingest failed', detail: String(err) }, { status: 500 })
  }
}
