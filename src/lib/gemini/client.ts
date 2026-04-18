import { GoogleGenerativeAI } from '@google/generative-ai'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

// Consumer-facing agent layer — X persona (SDK path)
export async function askX(prompt: string, context?: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return askXClaude(prompt)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: MODEL })
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
  const result = await model.generateContent(fullPrompt)
  return result.response.text()
}

async function askXClaude(userMessage: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are X, the AI artist manager for TENx10 representing DirtySnatcha Records (DSR).
You are confident, direct, and industry-savvy. You know the roster (DirtySnatcha, OZZTIN, MAVIC, PRIYANX, WHOiSEE),
the business (booking, streaming, marketing, touring), and how to get artists booked and paid.
Floor guarantee for DirtySnatcha: $1,500. Manager: Thomas Nalian. Agent: Andrew at AB Touring.
Answer concisely. Never be corporate. Keep it real.`,
    messages: [{ role: 'user', content: userMessage }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

// Call the AI Studio Cloud Run deployment directly
// This endpoint has the X system prompt baked in from AI Studio config
export async function askXCloudRun(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  userMessage: string
): Promise<string> {
  const cloudRunUrl = process.env.GEMINI_CLOUD_RUN_URL
  if (!cloudRunUrl) return askX(userMessage)

  const contents = [
    ...messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const res = await fetch(`${cloudRunUrl}/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  })

  if (!res.ok) {
    // Cloud Run may use root endpoint instead — retry
    const rootRes = await fetch(cloudRunUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })
    if (!rootRes.ok) return askX(userMessage)
    const rootData = await rootRes.json()
    return rootData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
