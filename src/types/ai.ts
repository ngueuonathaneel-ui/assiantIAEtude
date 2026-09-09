export type ProviderId =
  | 'gemini'
  | 'mistral'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'opencode'

export interface ModelInfo {
  id: string
  name: string
  description: string
  badge?: string
  isRecommended?: boolean
  contextLength?: string
}

export interface ProviderConfig {
  id: ProviderId
  name: string
  icon: string
  placeholderKey: string
  getKeyUrl: string
  helpText: string
  defaultModel: string
  models: ModelInfo[]
  allowCustomBaseUrl?: boolean
  defaultBaseUrl?: string
}

export interface ApiKeysState {
  gemini?: string
  mistral?: string
  openai?: string
  anthropic?: string
  openrouter?: string
  opencode?: string
  opencodeBaseUrl?: string
  opencodeCustomModel?: string
  customModelOverrides?: Partial<Record<ProviderId, string>>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  provider?: ProviderId
  model?: string
  studyMode?: string
  subject?: string
}

export interface ChatSession {
  id: string
  title: string
  subject: string
  level: string
  studyMode: string
  provider: ProviderId
  model: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}
