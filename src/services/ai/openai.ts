import type { ProviderConnectionResult, SendMessageOptions } from './types'

export async function sendOpenAIStream(options: SendMessageOptions): Promise<string> {
  const { messages, systemPrompt, model, apiKey, callbacks } = options
  const endpoint = 'https://api.openai.com/v1/chat/completions'

  const apiMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
    }),
    signal: callbacks.signal,
  })

  if (!response.ok) {
    let errorText = `Erreur OpenAI (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.error?.message) {
        errorText = `Erreur OpenAI : ${errJson.error.message}`
      }
    } catch {
      // ignore
    }
    throw new Error(errorText)
  }

  if (!response.body) {
    throw new Error("Le flux de réponse OpenAI est indisponible.")
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
      if (trimmed === 'data: [DONE]') continue
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6)
        try {
          const parsed = JSON.parse(jsonStr)
          const textChunk = parsed?.choices?.[0]?.delta?.content || ''
          if (textChunk) {
            fullText += textChunk
            callbacks.onChunk(textChunk, fullText)
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return fullText
}

export async function testOpenAIKey(apiKey: string, model = 'gpt-4o-mini'): Promise<ProviderConnectionResult> {
  try {
    const endpoint = 'https://api.openai.com/v1/chat/completions'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        ok: false,
        message: err.error?.message || `Erreur OpenAI (${response.status})`,
      }
    }

    return { ok: true, message: 'Clé OpenAI validée avec succès !' }
  } catch (err: unknown) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Impossible de contacter l’API OpenAI',
    }
  }
}
