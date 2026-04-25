const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const GROQ_FAST_MODEL = 'llama-3.1-8b-instant'   // extraction, classification
export const GROQ_WRITE_MODEL = 'llama-3.3-70b-versatile' // email drafting, writing

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function groqChat(
  messages: GroqMessage[],
  model: string = GROQ_FAST_MODEL,
  maxTokens: number = 1024,
): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
