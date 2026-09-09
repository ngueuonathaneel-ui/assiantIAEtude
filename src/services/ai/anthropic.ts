import type { ProviderConnectionResult, SendMessageOptions } from './types'

export async function sendAnthropicStream(options: SendMessageOptions): Promise<string> {
  const { messages, systemPrompt, model, apiKey, callbacks } = options
  const endpoint = 'https://api.anthropic.com/v1/messages'

  const apiMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const body: Record<string, unknown> = {
    model,
    messages: apiMessages,
    max_tokens: 4096,
    stream: true,
  }

  if (systemPrompt) {
    body.system = systemPrompt
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal: callbacks.signal,
  })

  if (!response.ok) {
    let errorText = `Erreur Anthropic (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.error?.message) {
        errorText = `Erreur Anthropic : ${errJson.error.message}`
      }
    } catch {
      // ignore
    }
    throw new Error(errorText)
  }

  if (!response.body) {
    throw new Error("Le flux de réponse Anthropic est indisponible.")
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
          if (
            parsed.type === 'content_block_delta' &&
            parsed.delta?.type === 'text_delta' &&
            parsed.delta?.text
          ) {
            const textChunk = parsed.delta.text
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

export async function testAnthropicKey(
  apiKey: string,
  model = 'claude-3-5-haiku-20241022',
): Promise<ProviderConnectionResult> {
  try {
    const endpoint = 'https://api.anthropic.com/v1/messages'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
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
        message: err.error?.message || `Erreur Anthropic (${response.status})`,
      }
    }

    return { ok: true, message: 'Clé Anthropic validée avec succès !' }
  } catch (err: unknown) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Impossible de contacter l’API Anthropic',
    }
  }
}
