import { useEffect, useRef, useState } from 'react'
import type { ApiKeysState, ChatMessage, ChatSession } from './types/ai'
import type { Flashcard } from './types/study'
import type { UserPreferences } from './services/storage'
import {
  loadApiKeys,
  loadChatSessions,
  loadCurrentSessionId,
  loadFlashcards,
  loadUserPreferences,
  saveApiKeys,
  saveChatSessions,
  saveCurrentSessionId,
  saveFlashcards,
  saveUserPreferences,
} from './services/storage'
import { getProviderConfig } from './services/ai/models'
import { buildSystemPrompt } from './services/prompts'
import { sendStudyMessageStream } from './services/ai/client'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ModeSelector } from './components/chat/ModeSelector'
import { ChatWindow } from './components/chat/ChatWindow'
import { ChatInput } from './components/chat/ChatInput'
import { ApiKeysModal } from './components/settings/ApiKeysModal'
import { FlashcardsModal } from './components/study/FlashcardsModal'

const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'demo-1',
    subject: 'maths',
    question: 'Théorème de Pythagore (Triangle rectangle)',
    answer: 'Dans un triangle rectangle, le carré de la longueur de l’hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés :\n\n$$a^2 + b^2 = c^2$$',
    createdAt: Date.now(),
  },
  {
    id: 'demo-2',
    subject: 'physique_chimie',
    question: 'Loi d’Ohm et Puissance électrique',
    answer: 'La tension $U$ (en Volts) aux bornes d’un conducteur ohmique de résistance $R$ (en Ohms) traversé par un courant $I$ (en Ampères) vaut :\n\n$$U = R \\times I$$\n\nEt la puissance électrique consommée vaut :\n\n$$P = U \\times I = R \\times I^2$$',
    createdAt: Date.now() - 1000,
  },
  {
    id: 'demo-3',
    subject: 'francais',
    question: 'Différence entre Métaphore et Comparaison',
    answer: '> **📌 Définition :**\n> - La **comparaison** rapproche deux éléments à l’aide d’un outil de comparaison (*comme, tel que, semblable à*).\n> - La **métaphore** assimile directement les deux éléments **sans outil de comparaison** (*Ce vieillard est un chêne majestueux*).',
    createdAt: Date.now() - 2000,
  },
]

export function App() {
  // Persistence state
  const [keys, setKeys] = useState<ApiKeysState>(() => loadApiKeys())
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadUserPreferences())
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadChatSessions())
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() =>
    loadCurrentSessionId(),
  )
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = loadFlashcards()
    return saved.length > 0 ? saved : INITIAL_FLASHCARDS
  })

  // Modals & UI toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Sync dark theme class to document body
  useEffect(() => {
    if (prefs.darkMode) {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
    }
  }, [prefs.darkMode])

  // Save prefs
  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...newPrefs }
      saveUserPreferences(updated)
      return updated
    })
  }

  // Active current session
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || null

  const currentMessages = currentSession ? currentSession.messages : []

  // Ensure current session exists or initialize when sending
  const getOrCreateSession = (firstUserMessage: string): ChatSession => {
    if (currentSession) {
      return currentSession
    }

    const title =
      firstUserMessage.length > 35
        ? `${firstUserMessage.slice(0, 35)}...`
        : firstUserMessage

    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      subject: prefs.activeSubject,
      level: prefs.activeLevel,
      studyMode: prefs.activeMode,
      provider: prefs.activeProvider,
      model: prefs.activeModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }

    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    saveChatSessions(updatedSessions)
    setCurrentSessionId(newSession.id)
    saveCurrentSessionId(newSession.id)
    return newSession
  }

  // Send message stream
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return

    const activeProvider = prefs.activeProvider
    const activeModel = prefs.activeModel
    const apiKey = keys[activeProvider] || ''

    if (!apiKey && activeProvider !== 'opencode') {
      setIsSettingsOpen(true)
      return
    }

    const targetSession = getOrCreateSession(text)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      provider: activeProvider,
      model: activeModel,
      studyMode: prefs.activeMode,
      subject: prefs.activeSubject,
    }

    const updatedMessages = [...targetSession.messages, userMessage]

    // Update session with user message
    const updatedSession: ChatSession = {
      ...targetSession,
      subject: prefs.activeSubject,
      level: prefs.activeLevel,
      studyMode: prefs.activeMode,
      provider: activeProvider,
      model: activeModel,
      updatedAt: Date.now(),
      messages: updatedMessages,
    }

    const nextSessions = sessions.map((s) =>
      s.id === updatedSession.id ? updatedSession : s,
    )
    if (!sessions.some((s) => s.id === updatedSession.id)) {
      nextSessions.unshift(updatedSession)
    }

    setSessions(nextSessions)
    saveChatSessions(nextSessions)

    // Start streaming
    setIsStreaming(true)
    setStreamingText('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    const systemPrompt = buildSystemPrompt({
      subject: prefs.activeSubject,
      level: prefs.activeLevel,
      mode: prefs.activeMode,
    })

    try {
      const fullResponse = await sendStudyMessageStream(activeProvider, {
        messages: updatedMessages,
        systemPrompt,
        model: activeModel,
        apiKey,
        baseUrl: keys.opencodeBaseUrl,
        callbacks: {
          onChunk: (_chunk, accumulated) => {
            setStreamingText(accumulated)
          },
          signal: controller.signal,
        },
      })

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: fullResponse || 'Explication terminée.',
        timestamp: Date.now(),
        provider: activeProvider,
        model: activeModel,
        studyMode: prefs.activeMode,
        subject: prefs.activeSubject,
      }

      const sessionWithBot: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, botMessage],
        updatedAt: Date.now(),
      }

      const finalizedSessions = sessions.map((s) =>
        s.id === sessionWithBot.id ? sessionWithBot : s,
      )
      if (!sessions.some((s) => s.id === sessionWithBot.id)) {
        finalizedSessions.unshift(sessionWithBot)
      }

      setSessions(finalizedSessions)
      saveChatSessions(finalizedSessions)
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Erreur lors de la réponse de l'IA :** ${(err as Error).message}\n\n*Vérifie ta clé d'API ou ton quota dans les Paramètres.*`,
          timestamp: Date.now(),
          provider: activeProvider,
          model: activeModel,
        }

        const sessionWithError: ChatSession = {
          ...updatedSession,
          messages: [...updatedMessages, errorMessage],
        }

        const errSessions = sessions.map((s) =>
          s.id === sessionWithError.id ? sessionWithError : s,
        )
        setSessions(errSessions)
        saveChatSessions(errSessions)
      }
    } finally {
      setIsStreaming(false)
      setStreamingText('')
      abortControllerRef.current = null
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }

  const handleNewSession = () => {
    handleStopGeneration()
    setCurrentSessionId(null)
    saveCurrentSessionId(null)
  }

  const handleDeleteSession = (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id)
    setSessions(nextSessions)
    saveChatSessions(nextSessions)
    if (currentSessionId === id) {
      setCurrentSessionId(null)
      saveCurrentSessionId(null)
    }
  }

  const handleSaveKeys = (newKeys: ApiKeysState) => {
    setKeys(newKeys)
    saveApiKeys(newKeys)
  }

  const handleAddFlashcard = (card: Omit<Flashcard, 'id' | 'createdAt'>) => {
    const newCard: Flashcard = {
      ...card,
      id: `fc-${Date.now()}`,
      createdAt: Date.now(),
    }
    const updated = [newCard, ...flashcards]
    setFlashcards(updated)
    saveFlashcards(updated)
  }

  const handleDeleteFlashcard = (id: string) => {
    const updated = flashcards.filter((f) => f.id !== id)
    setFlashcards(updated)
    saveFlashcards(updated)
  }

  const hasCurrentApiKey =
    !!keys[prefs.activeProvider] || prefs.activeProvider === 'opencode'

  return (
    <div className="app-layout">
      {/* Sidebar for chat history and subject filters */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          handleStopGeneration()
          setCurrentSessionId(id)
          saveCurrentSessionId(id)
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        activeSubject={prefs.activeSubject}
        onSelectSubject={(subj) => updatePrefs({ activeSubject: subj })}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Top Header */}
        <Header
          activeProvider={prefs.activeProvider}
          onChangeProvider={(provider) => {
            const config = getProviderConfig(provider)
            updatePrefs({
              activeProvider: provider,
              activeModel: config.defaultModel,
            })
          }}
          activeModel={prefs.activeModel}
          onChangeModel={(model) => updatePrefs({ activeModel: model })}
          activeSubject={prefs.activeSubject}
          onChangeSubject={(subj) => updatePrefs({ activeSubject: subj })}
          activeLevel={prefs.activeLevel}
          onChangeLevel={(lvl) => updatePrefs({ activeLevel: lvl })}
          activeMode={prefs.activeMode}
          onChangeMode={(mode) => updatePrefs({ activeMode: mode })}
          keys={keys}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          darkMode={prefs.darkMode}
          onToggleDarkMode={() => updatePrefs({ darkMode: !prefs.darkMode })}
        />

        {/* Pedagogical Mode Selector Bar */}
        <ModeSelector
          activeMode={prefs.activeMode}
          onSelectMode={(mode) => updatePrefs({ activeMode: mode })}
        />

        {/* Scrollable Chat Area */}
        <ChatWindow
          messages={currentMessages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          activeProvider={prefs.activeProvider}
          activeModel={prefs.activeModel}
          activeSubject={prefs.activeSubject}
          activeLevel={prefs.activeLevel}
          activeMode={prefs.activeMode}
          hasApiKey={hasCurrentApiKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onQuickPrompt={handleSendMessage}
          onSaveToFlashcards={(q, a) =>
            handleAddFlashcard({
              question: q,
              answer: a,
              subject: prefs.activeSubject,
            })
          }
        />

        {/* Bottom Input with suggestions and controls */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          activeSubject={prefs.activeSubject}
          activeMode={prefs.activeMode}
        />
      </div>

      {/* Settings Modal (API keys & Endpoints) */}
      <ApiKeysModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
        activeProvider={prefs.activeProvider}
        onSelectProvider={(p) => {
          const cfg = getProviderConfig(p)
          updatePrefs({ activeProvider: p, activeModel: cfg.defaultModel })
        }}
      />

      {/* Flashcards Practice Modal */}
      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        flashcards={flashcards}
        onAddFlashcard={handleAddFlashcard}
        onDeleteFlashcard={handleDeleteFlashcard}
      />
    </div>
  )
}

export default App
