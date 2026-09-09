import { useEffect, useRef, useState } from 'react'
import type { ApiKeysState, ChatMessage, ChatSession } from './types/ai'
import type { Flashcard, SrsRating } from './types/study'
import type { UserPreferences } from './services/storage'
import {
  clearStudyData,
  downloadBackup,
  loadApiKeys,
  loadChatSessions,
  loadCurrentSessionId,
  loadFlashcards,
  loadUserPreferences,
  parseBackupFile,
  restoreBackup,
  saveApiKeys,
  saveChatSessions,
  saveCurrentSessionId,
  saveFlashcards,
  saveUserPreferences,
} from './services/storage'
import { getProviderConfig } from './services/ai/models'
import { buildSystemPrompt } from './services/prompts'
import { sendStudyMessageStream } from './services/ai/client'
import { scheduleReview } from './services/srs'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ModeSelector } from './components/chat/ModeSelector'
import { ChatWindow } from './components/chat/ChatWindow'
import { ChatInput } from './components/chat/ChatInput'
import { ApiKeysModal } from './components/settings/ApiKeysModal'
import { FlashcardsModal } from './components/study/FlashcardsModal'
import { ToastStack } from './components/ui/Toast'
import { useToasts } from './components/ui/useToasts'
import { ConfirmDialog, type ConfirmRequest } from './components/ui/ConfirmDialog'

const MOBILE_BREAKPOINT = 900

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

function upsertSession(list: ChatSession[], session: ChatSession): ChatSession[] {
  const exists = list.some((s) => s.id === session.id)
  if (!exists) return [session, ...list]
  return list.map((s) => (s.id === session.id ? session : s))
}

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth > MOBILE_BREAKPOINT,
  )
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT,
  )
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const { toasts, pushToast, dismissToast } = useToasts()

  // Sync dark theme class to document body
  useEffect(() => {
    if (prefs.darkMode) {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
    }
  }, [prefs.darkMode])

  // Track viewport size for the mobile (overlay) sidebar behaviour
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  /**
   * Streams a fresh assistant reply for `session` given `apiMessages` as the
   * conversation history to send. Shared by "send", "regenerate" and "edit & resend".
   */
  const runAssistant = async (session: ChatSession, apiMessages: ChatMessage[]) => {
    const activeProvider = prefs.activeProvider
    const activeModel = prefs.activeModel
    const apiKey = keys[activeProvider] || ''

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
        messages: apiMessages,
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
        ...session,
        messages: [...apiMessages, botMessage],
        updatedAt: Date.now(),
      }

      setSessions((prev) => {
        const next = upsertSession(prev, sessionWithBot)
        saveChatSessions(next)
        return next
      })
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const message = (err as Error).message
        pushToast('error', message)

        const errorMessage: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Erreur lors de la réponse de l'IA :** ${message}\n\n*Vérifie ta clé d'API ou ton quota dans les Paramètres.*`,
          timestamp: Date.now(),
          provider: activeProvider,
          model: activeModel,
        }

        const sessionWithError: ChatSession = {
          ...session,
          messages: [...apiMessages, errorMessage],
        }

        setSessions((prev) => {
          const next = upsertSession(prev, sessionWithError)
          saveChatSessions(next)
          return next
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingText('')
      abortControllerRef.current = null
    }
  }

  // Send message stream
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return

    const activeProvider = prefs.activeProvider
    const apiKey = keys[activeProvider] || ''

    if (!apiKey && activeProvider !== 'opencode') {
      setIsSettingsOpen(true)
      pushToast('info', `Configure ta clé ${getProviderConfig(activeProvider).name} pour commencer.`)
      return
    }

    const targetSession = getOrCreateSession(text)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      provider: activeProvider,
      model: prefs.activeModel,
      studyMode: prefs.activeMode,
      subject: prefs.activeSubject,
    }

    const updatedMessages = [...targetSession.messages, userMessage]

    const updatedSession: ChatSession = {
      ...targetSession,
      subject: prefs.activeSubject,
      level: prefs.activeLevel,
      studyMode: prefs.activeMode,
      provider: activeProvider,
      model: prefs.activeModel,
      updatedAt: Date.now(),
      messages: updatedMessages,
    }

    setSessions((prev) => {
      const next = upsertSession(prev, updatedSession)
      saveChatSessions(next)
      return next
    })

    await runAssistant(updatedSession, updatedMessages)
  }

  const handleRegenerate = async () => {
    if (!currentSession || isStreaming) return
    const messages = currentSession.messages
    const lastAssistantIdx = [...messages].reverse().findIndex((m) => m.role === 'assistant')
    if (lastAssistantIdx === -1) return
    const cutIndex = messages.length - 1 - lastAssistantIdx
    const truncated = messages.slice(0, cutIndex)

    const updatedSession: ChatSession = { ...currentSession, messages: truncated }
    setSessions((prev) => {
      const next = upsertSession(prev, updatedSession)
      saveChatSessions(next)
      return next
    })

    await runAssistant(updatedSession, truncated)
  }

  const handleEditMessage = async (id: string, newContent: string) => {
    if (!currentSession || isStreaming) return
    const idx = currentSession.messages.findIndex((m) => m.id === id)
    if (idx === -1) return

    const editedMessage: ChatMessage = {
      ...currentSession.messages[idx],
      content: newContent,
      timestamp: Date.now(),
    }
    const truncated = [...currentSession.messages.slice(0, idx), editedMessage]

    const updatedSession: ChatSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: truncated,
    }
    setSessions((prev) => {
      const next = upsertSession(prev, updatedSession)
      saveChatSessions(next)
      return next
    })

    await runAssistant(updatedSession, truncated)
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }

  const closeSidebarOnMobile = () => {
    if (isMobile) setIsSidebarOpen(false)
  }

  const handleNewSession = () => {
    handleStopGeneration()
    setCurrentSessionId(null)
    saveCurrentSessionId(null)
    closeSidebarOnMobile()
  }

  const handleDeleteSession = (id: string) => {
    const target = sessions.find((s) => s.id === id)
    setConfirmRequest({
      title: 'Supprimer cette session ?',
      message: `« ${target?.title || 'Cette session'} » et tous ses messages seront définitivement supprimés.`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: () => {
        const nextSessions = sessions.filter((s) => s.id !== id)
        setSessions(nextSessions)
        saveChatSessions(nextSessions)
        if (currentSessionId === id) {
          setCurrentSessionId(null)
          saveCurrentSessionId(null)
        }
        pushToast('success', 'Session supprimée.')
      },
    })
  }

  const handleRenameSession = (id: string, title: string) => {
    const nextSessions = sessions.map((s) => (s.id === id ? { ...s, title } : s))
    setSessions(nextSessions)
    saveChatSessions(nextSessions)
  }

  const handleSaveKeys = (newKeys: ApiKeysState) => {
    setKeys(newKeys)
    saveApiKeys(newKeys)
    pushToast('success', 'Clés enregistrées avec succès.')
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
    pushToast('success', 'Flashcard ajoutée.')
  }

  const handleDeleteFlashcard = (id: string) => {
    const updated = flashcards.filter((f) => f.id !== id)
    setFlashcards(updated)
    saveFlashcards(updated)
  }

  const handleRateFlashcard = (id: string, rating: SrsRating) => {
    const updated = flashcards.map((f) => (f.id === id ? scheduleReview(f, rating) : f))
    setFlashcards(updated)
    saveFlashcards(updated)
  }

  const handleExportBackup = () => {
    downloadBackup()
    pushToast('success', 'Sauvegarde téléchargée.')
  }

  const handleImportBackupFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = parseBackupFile(String(reader.result))
        setConfirmRequest({
          title: 'Restaurer cette sauvegarde ?',
          message:
            'Tes sessions, flashcards et préférences actuelles seront remplacées par le contenu du fichier importé.',
          confirmLabel: 'Restaurer',
          danger: true,
          onConfirm: () => {
            restoreBackup(backup)
            setSessions(backup.sessions)
            setFlashcards(backup.flashcards.length > 0 ? backup.flashcards : INITIAL_FLASHCARDS)
            setPrefs(backup.preferences)
            setCurrentSessionId(null)
            saveCurrentSessionId(null)
            pushToast('success', 'Sauvegarde restaurée avec succès.')
          },
        })
      } catch (err) {
        pushToast('error', err instanceof Error ? err.message : 'Fichier de sauvegarde illisible.')
      }
    }
    reader.readAsText(file)
  }

  const handleClearAllData = () => {
    setConfirmRequest({
      title: 'Effacer toutes les données locales ?',
      message:
        'Toutes tes sessions de discussion et flashcards seront supprimées de ce navigateur. Cette action est irréversible. Pense à exporter une sauvegarde avant si besoin.',
      confirmLabel: 'Tout effacer',
      danger: true,
      onConfirm: () => {
        clearStudyData()
        setSessions([])
        setFlashcards(INITIAL_FLASHCARDS)
        setCurrentSessionId(null)
        setIsSettingsOpen(false)
        pushToast('success', 'Toutes les données locales ont été effacées.')
      },
    })
  }

  const hasCurrentApiKey =
    !!keys[prefs.activeProvider] || prefs.activeProvider === 'opencode'

  // Global keyboard shortcuts: Ctrl/Cmd+K new chat, "/" focuses the composer, Esc closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target && (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        handleNewSession()
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault()
        document.getElementById('chat-textarea-main')?.focus()
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false)
        setIsFlashcardsOpen(false)
        setConfirmRequest(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, isMobile])

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
          closeSidebarOnMobile()
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onExportBackup={handleExportBackup}
        activeSubject={prefs.activeSubject}
        onSelectSubject={(subj) => updatePrefs({ activeSubject: subj })}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
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
          keys={keys}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          darkMode={prefs.darkMode}
          onToggleDarkMode={() => updatePrefs({ darkMode: !prefs.darkMode })}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          hasMissingKey={!hasCurrentApiKey}
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
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
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
        onExportBackup={handleExportBackup}
        onImportBackupFile={handleImportBackupFile}
        onClearAllData={handleClearAllData}
      />

      {/* Flashcards Practice Modal */}
      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        flashcards={flashcards}
        onAddFlashcard={handleAddFlashcard}
        onDeleteFlashcard={handleDeleteFlashcard}
        onRateCard={handleRateFlashcard}
      />

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
