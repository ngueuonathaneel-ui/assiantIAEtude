import React, { useEffect, useRef } from 'react'
import {
  CheckSquare,
  FileSearch,
  GraduationCap,
  KeyRound,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import type { ChatMessage, ProviderId } from '../../types/ai'
import type { StudyLevel, StudyMode, StudySubject } from '../../types/study'
import {
  LEVELS_DATA,
  STUDY_MODES_DATA,
  SUBJECTS_DATA,
} from '../../services/prompts'
import { getProviderConfig } from '../../services/ai/models'
import { MessageItem } from './MessageItem'

interface ChatWindowProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingText: string
  activeProvider: ProviderId
  activeModel: string
  activeSubject: StudySubject
  activeLevel: StudyLevel
  activeMode: StudyMode
  hasApiKey: boolean
  onOpenSettings: () => void
  onQuickPrompt: (text: string) => void
  onSaveToFlashcards: (question: string, answer: string) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  streamingText,
  activeProvider,
  activeModel,
  activeSubject,
  activeLevel,
  activeMode,
  hasApiKey,
  onOpenSettings,
  onQuickPrompt,
  onSaveToFlashcards,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const subjectInfo = SUBJECTS_DATA[activeSubject] || SUBJECTS_DATA.general
  const modeInfo = STUDY_MODES_DATA[activeMode] || STUDY_MODES_DATA.socratique
  const levelInfo = LEVELS_DATA[activeLevel] || LEVELS_DATA.lycee
  const providerConfig = getProviderConfig(activeProvider)

  // Scroll to bottom when new messages arrive or when streaming updates
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  return (
    <div className="chat-window-scroll">
      {/* Empty state when no messages yet */}
      {messages.length === 0 ? (
        <div className="welcome-study-hero">
          <div className="hero-icon-ring">
            <GraduationCap size={44} className="text-indigo-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Académie d'Étude Intelligente • Révisions Personnalisées</span>
          </div>

          <h2 className="hero-heading">
            Prêt à exceller en <span className="logo-highlight">{subjectInfo.label}</span> ?
          </h2>

          <p className="hero-subtext">
            Niveau actuel : <strong>{levelInfo.label}</strong> • Mode actif :{' '}
            <strong style={{ color: modeInfo.color }}>{modeInfo.label}</strong>
            <br />
            Moteur IA : <span className="message-model-tag">{providerConfig.name} ({activeModel})</span>
          </p>

          {/* Missing API key alert banner */}
          {!hasApiKey && (
            <div className="empty-state-api-banner">
              <div className="flex items-center gap-3">
                <div className="banner-icon-bg">
                  <KeyRound size={22} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200">
                    Clé d'API {providerConfig.name} manquante
                  </h4>
                  <p className="text-xs text-amber-300/80">
                    Pour poser des questions à l'IA, renseigne ta clé d'API personnelle (gratuite pour Gemini).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="btn-banner-config-key"
              >
                Configurer ma clé
              </button>
            </div>
          )}

          {/* Starter action cards */}
          <div className="starter-cards-grid">
            <button
              type="button"
              onClick={() =>
                onQuickPrompt(
                  `Explique-moi pas à pas une notion fondamentale en ${subjectInfo.label}.`,
                )
              }
              className="starter-card"
            >
              <div className="starter-card-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                <Lightbulb size={22} className="text-indigo-400" />
              </div>
              <div className="starter-card-texts">
                <h4>Comprendre une notion</h4>
                <p>Explications claires avec des analogies du quotidien</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onQuickPrompt(
                  `Fais-moi un quiz de 4 questions pour tester mes connaissances en ${subjectInfo.label}.`,
                )
              }
              className="starter-card"
            >
              <div className="starter-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckSquare size={22} className="text-emerald-400" />
              </div>
              <div className="starter-card-texts">
                <h4>S'auto-évaluer (Quiz)</h4>
                <p>Questions d'entraînement interactives avec explications</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onQuickPrompt(
                  `Montre-moi la méthode rigoureuse pas-à-pas pour résoudre un exercice type en ${subjectInfo.label}.`,
                )
              }
              className="starter-card"
            >
              <div className="starter-card-icon" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)' }}>
                <FileSearch size={22} className="text-rose-400" />
              </div>
              <div className="starter-card-texts">
                <h4>Méthode & Résolution</h4>
                <p>Démonstration rigoureuse avec formules scientifiques</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="messages-stream-list">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSaveToFlashcards={onSaveToFlashcards}
            />
          ))}

          {/* Active streaming message */}
          {isStreaming && (
            <div className="message-row assistant-row">
              <div className="message-container">
                <div className="message-avatar bot-avatar">
                  <Sparkles size={18} className="animate-spin text-emerald-300" />
                </div>
                <div className="message-bubble-wrap">
                  <div className="message-header-bar">
                    <span className="message-sender-name">
                      Assistant IA ({activeModel})
                    </span>
                    <span className="streaming-pulse-indicator">
                      ✦ Rédaction en direct...
                    </span>
                  </div>
                  <div className="message-body">
                    {streamingText ? (
                      <MessageItem
                        message={{
                          id: 'streaming-temp',
                          role: 'assistant',
                          content: streamingText,
                          timestamp: 0,
                          provider: activeProvider,
                          model: activeModel,
                        }}
                      />
                    ) : (
                      <div className="typing-dots-animation">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={scrollEndRef} className="scroll-anchor" />
    </div>
  )
}
