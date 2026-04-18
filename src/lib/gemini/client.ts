import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use env var so model can be updated without code change
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

export const geminiFlash = genAI.getGenerativeModel({ model: MODEL })
export const geminiPro = genAI.getGenerativeModel({ model: MODEL })

// Consumer-facing agent layer — X persona (SDK path)
export async function askX(prompt: string, context?: string) {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
  const result = await geminiFlash.generateContent(fullPrompt)
  return result.response.text()
}

// Call the AI Studio Cloud Run deployment directly
// This endpoint has the X system prompt baked in from AI Studio config
export async function askXCloudRun(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  userMessage: string
): Promise<string> {
  const cloudRunUrl = process.env.GEMINI_CLOUD_RUN_URL
  if (!cloudRunUrl) {
    // Fallback to SDK if Cloud Run not configured
    return askX(userMessage)
  }

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
    if (!rootRes.ok) {
      // Fall back to SDK
      return askX(userMessage)
    }
    const rootData = await rootRes.json()
    return rootData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
