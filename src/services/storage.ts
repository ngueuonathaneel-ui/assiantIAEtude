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
  darkMode: true,
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

export interface StudyBackup {
  version: 1
  exportedAt: number
  sessions: ChatSession[]
  flashcards: Flashcard[]
  preferences: UserPreferences
}

/** Builds a full backup of study data. API keys are intentionally excluded for safety. */
export function buildBackup(): StudyBackup {
  return {
    version: 1,
    exportedAt: Date.now(),
    sessions: loadChatSessions(),
    flashcards: loadFlashcards(),
    preferences: loadUserPreferences(),
  }
}

export function downloadBackup(): void {
  const backup = buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `studyai-sauvegarde-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(raw: string): StudyBackup {
  const parsed = JSON.parse(raw) as Partial<StudyBackup>
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions)) {
    throw new Error('Fichier de sauvegarde invalide ou corrompu.')
  }
  return {
    version: 1,
    exportedAt: typeof parsed.exportedAt === 'number' ? parsed.exportedAt : Date.now(),
    sessions: parsed.sessions ?? [],
    flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
    preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
  }
}

export function restoreBackup(backup: StudyBackup): void {
  saveChatSessions(backup.sessions)
  saveFlashcards(backup.flashcards)
  saveUserPreferences(backup.preferences)
}

/** Wipes all locally stored study data (sessions, flashcards, prefs). API keys are kept. */
export function clearStudyData(): void {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY)
    localStorage.removeItem(CURRENT_SESSION_KEY)
    localStorage.removeItem(FLASHCARDS_STORAGE_KEY)
  } catch (e) {
    console.error('Erreur lors de la suppression des données:', e)
  }
}
