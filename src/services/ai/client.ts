import type { ApiKeysState, ProviderId } from '../../types/ai'
import { sendAnthropicStream, testAnthropicKey } from './anthropic'
import { sendGeminiStream, testGeminiKey } from './gemini'
import { sendMistralStream, testMistralKey } from './mistral'
import { sendOpenAIStream, testOpenAIKey } from './openai'
import { sendOpenRouterStream, testOpenRouterKey } from './openrouter'
import { sendOpenCodeStream, testOpenCodeKey } from './opencode'
import type { ProviderConnectionResult, SendMessageOptions } from './types'

export async function sendStudyMessageStream(
  provider: ProviderId,
  options: SendMessageOptions,
): Promise<string> {
  if (!options.apiKey && provider !== 'opencode') {
    throw new Error(
      `Veuillez configurer votre clé d'API pour ${provider.toUpperCase()} dans les Paramètres (roue crantée en haut à droite).`,
    )
  }

  switch (provider) {
    case 'gemini':
      return sendGeminiStream(options)
    case 'openai':
      return sendOpenAIStream(options)
    case 'anthropic':
      return sendAnthropicStream(options)
    case 'mistral':
      return sendMistralStream(options)
    case 'openrouter':
      return sendOpenRouterStream(options)
    case 'opencode':
      return sendOpenCodeStream(options)
    default:
      throw new Error(`Fournisseur d'IA inconnu : ${provider}`)
  }
}

export async function testProviderConnection(
  provider: ProviderId,
  keys: ApiKeysState,
  model?: string,
): Promise<ProviderConnectionResult> {
  const apiKey = keys[provider] || ''
  if (!apiKey && provider !== 'opencode') {
    return { ok: false, message: 'Aucune clé d’API renseignée pour ce fournisseur.' }
  }

  switch (provider) {
    case 'gemini':
      return testGeminiKey(apiKey, model || 'gemini-2.0-flash')
    case 'openai':
      return testOpenAIKey(apiKey, model || 'gpt-4o-mini')
    case 'anthropic':
      return testAnthropicKey(apiKey, model || 'claude-3-5-haiku-20241022')
    case 'mistral':
      return testMistralKey(apiKey, model || 'mistral-small-latest')
    case 'openrouter':
      return testOpenRouterKey(apiKey, model || 'deepseek/deepseek-chat')
    case 'opencode':
      return testOpenCodeKey(
        apiKey,
        model || 'deepseek-coder',
        keys.opencodeBaseUrl || 'http://localhost:11434/v1',
      )
    default:
      return { ok: false, message: 'Fournisseur non pris en charge.' }
  }
}
