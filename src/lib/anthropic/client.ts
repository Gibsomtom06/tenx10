import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'

export async function streamWithClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
) {
  return anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens ?? 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
}
