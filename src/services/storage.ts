import type { ApiKeysState, ChatSession, ProviderId } from '../types/ai'
import type { Flashcard, StudyLevel, StudyMode, StudySubject } from '../types/study'

const KEYS_STORAGE_KEY = 'study_assistant_api_keys_v1'
const SESSIONS_STORAGE_KEY = 'study_assistant_sessions_v1'
const CURRENT_SESSION_KEY = 'study_assistant_current_session_v1'
const FLASHCARDS_STORAGE_KEY = 'study_assistant_flashcards_v1'
const USER_PREFS_KEY = 'study_assistant_user_prefs_v1'

export interface UserPreferences {
  activeProvider: ProviderId
  activeModel: string
  activeSubject: StudySubject
  activeLevel: StudyLevel
  activeMode: StudyMode
  darkMode: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  activeProvider: 'gemini',
  activeModel: 'gemini-2.0-flash',
  activeSubject: 'maths',
  activeLevel: 'lycee',
  activeMode: 'socratique',
  darkMode: false,
}

export function loadApiKeys(): ApiKeysState {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Erreur chargement clés API:', e)
  }
  return {
    opencodeBaseUrl: 'http://localhost:11434/v1',
  }
}

export function saveApiKeys(keys: ApiKeysState): void {
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys))
  } catch (e) {
    console.error('Erreur sauvegarde clés API:', e)
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(USER_PREFS_KEY)
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error('Erreur chargement préférences:', e)
  }
  return DEFAULT_PREFERENCES
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.error('Erreur sauvegarde préférences:', e)
  }
}

export function loadChatSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Erreur chargement sessions:', e)
  }
  return []
}

export function saveChatSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Erreur sauvegarde sessions:', e)
  }
}

export function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY)
  } catch {
    return null
  }
}

export function saveCurrentSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_SESSION_KEY, id)
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY)
    }
  } catch (e) {
    console.error('Erreur sauvegarde ID session:', e)
  }
}

export function loadFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(FLASHCARDS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Erreur chargement flashcards:', e)
  }
  return []
}

export function saveFlashcards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards))
  } catch (e) {
    console.error('Erreur sauvegarde flashcards:', e)
  }
}
