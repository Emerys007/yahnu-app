import 'server-only'

import type { z } from 'zod'

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY
}

function extractJsonText(response: GeminiResponse) {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim()

  if (!text) throw new Error('The AI service returned no usable result.')

  return text.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
}

/**
 * Minimal server-only Gemini transport. It avoids shipping an AI SDK, keeps the
 * key on Render, and validates every model response before it reaches the UI.
 */
export async function generateGeminiJson<T>({
  parts,
  schema,
}: {
  parts: GeminiPart[]
  schema: z.ZodType<T>
}): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('AI features are not configured for this deployment.')

  const model = process.env.YAHNU_GEMINI_MODEL || 'gemini-3.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  )

  if (!response.ok) {
    console.error('Gemini request failed:', response.status)
    throw new Error('The AI service is temporarily unavailable. Please try again later.')
  }

  const payload = (await response.json()) as GeminiResponse
  try {
    return schema.parse(JSON.parse(extractJsonText(payload)))
  } catch (error) {
    console.error('Gemini returned an invalid structured response:', error)
    throw new Error('The AI service returned an invalid response. Please try again.')
  }
}
