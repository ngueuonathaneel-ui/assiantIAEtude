import type { ChatMessage } from '../../types/ai'

export interface StreamCallbacks {
  onChunk: (chunk: string, fullText: string) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

export interface SendMessageOptions {
  messages: ChatMessage[]
  systemPrompt: string
  model: string
  apiKey: string
  baseUrl?: string
  callbacks: StreamCallbacks
}

export interface ProviderConnectionResult {
  ok: boolean
  message: string
}
