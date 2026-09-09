import React, { useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles, Square } from 'lucide-react'
import { STUDY_MODES_DATA, SUBJECTS_DATA } from '../../services/prompts'
import type { StudyMode, StudySubject } from '../../types/study'

interface ChatInputProps {
  onSendMessage: (content: string) => void
  onStopGeneration: () => void
  isStreaming: boolean
  activeSubject: StudySubject
  activeMode: StudyMode
  disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  activeSubject,
  activeMode,
  disabled,
}) => {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const subjectInfo = SUBJECTS_DATA[activeSubject] || SUBJECTS_DATA.general

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180,
      )}px`
    }
  }, [text])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || isStreaming || disabled) return
    onSendMessage(text.trim())
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickPromptClick = (prompt: string) => {
    onSendMessage(prompt)
  }

  return (
    <div className="chat-input-container">
      {/* Quick suggestions chips */}
      <div className="quick-suggestions-bar">
        <span className="quick-title">
          <Sparkles size={12} className="text-amber-400 inline mr-1" />
          Idées de questions ({subjectInfo.label}) :
        </span>
        <div className="quick-chips-scroll">
          {subjectInfo.examples.slice(0, 3).map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPromptClick(example)}
              disabled={isStreaming || disabled}
              className="quick-suggestion-chip"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Main input card */}
      <form onSubmit={handleSubmit} className="chat-input-box">
        <textarea
          id="chat-textarea-main"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Pose ta question en ${subjectInfo.label} [${STUDY_MODES_DATA[activeMode]?.label || 'Tuteur'}] (Shift+Entrée pour un saut de ligne)...`}
          disabled={isStreaming || disabled}
          rows={1}
          className="chat-textarea"
        />

        <div className="chat-input-controls">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="btn-stop-stream"
              title="Arrêter la réponse de l'IA"
            >
              <Square size={14} className="fill-current" />
              <span>Arrêter</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!text.trim() || disabled}
              className="btn-send-message"
              title="Envoyer la question (Entrée)"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </form>

      <div className="input-hint-row">
        <span className="input-hint-text">
          <kbd>Entrée</kbd> envoyer · <kbd>Maj+Entrée</kbd> nouvelle ligne · <kbd>/</kbd> pour écrire depuis n'importe où
        </span>
      </div>
    </div>
  )
}
