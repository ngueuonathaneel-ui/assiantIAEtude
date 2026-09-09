import type { ProviderConnectionResult, SendMessageOptions } from './types'

export async function sendGeminiStream(options: SendMessageOptions): Promise<string> {
  const { messages, systemPrompt, model, apiKey, callbacks } = options
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  }

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: callbacks.signal,
  })

  if (!response.ok) {
    let errorText = `Erreur Gemini (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.error?.message) {
        errorText = `Erreur Gemini : ${errJson.error.message}`
      }
    } catch {
      // ignore
    }
    throw new Error(errorText)
  }

  if (!response.body) {
    throw new Error("Le flux de réponse Gemini est indisponible.")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6)
        try {
          const parsed = JSON.parse(jsonStr)
          const textChunk =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (textChunk) {
            fullText += textChunk
            callbacks.onChunk(textChunk, fullText)
          }
        } catch {
          // ignore incomplete JSON chunk
        }
      }
    }
  }

  return fullText
}

export async function testGeminiKey(apiKey: string, model = 'gemini-2.0-flash'): Promise<ProviderConnectionResult> {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Salut, réponds juste par "OK".' }] }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        ok: false,
        message: err.error?.message || `Erreur d'authentification Gemini (${response.status})`,
      }
    }

    return { ok: true, message: 'Clé Google Gemini validée avec succès !' }
  } catch (err: unknown) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Impossible de contacter l’API Gemini',
    }
  }
}
