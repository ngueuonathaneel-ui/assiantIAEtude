import React, { useState } from 'react'
import {
  BookmarkPlus,
  Bot,
  Check,
  Copy,
  Pencil,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react'
import type { ChatMessage } from '../../types/ai'
import { MarkdownRenderer } from './MarkdownRenderer'
import { getProviderConfig } from '../../services/ai/models'

interface MessageItemProps {
  message: ChatMessage
  onSaveToFlashcards?: (question: string, answer: string) => void
  onEditMessage?: (id: string, newContent: string) => void
  onRegenerate?: () => void
  isLastAssistant?: boolean
  disableActions?: boolean
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSaveToFlashcards,
  onEditMessage,
  onRegenerate,
  isLastAssistant,
  disableActions,
}) => {
  const [copied, setCopied] = useState(false)
  const [savedFlashcard, setSavedFlashcard] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)

  const isUser = message.role === 'user'
  const providerConfig = message.provider ? getProviderConfig(message.provider) : null

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveFlashcard = () => {
    if (onSaveToFlashcards) {
      // Use the first line or a summary as question, and content as answer
      const lines = message.content.split('\n').filter((l) => l.trim().length > 0)
      const question = lines[0]?.replace(/^[#*>\s]+/, '').slice(0, 100) || 'Notion clé'
      onSaveToFlashcards(question, message.content)
      setSavedFlashcard(true)
      setTimeout(() => setSavedFlashcard(false), 2500)
    }
  }

  const startEdit = () => {
    setEditText(message.content)
    setIsEditing(true)
  }

  const commitEdit = () => {
    if (onEditMessage && editText.trim() && editText.trim() !== message.content) {
      onEditMessage(message.id, editText.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className={`message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      <div className="message-container">
        {/* Avatar */}
        <div className={`message-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className="message-bubble-wrap">
          {/* Message Header */}
          <div className="message-header-bar">
            <span className="message-sender-name">
              {isUser ? 'Toi (Élève)' : 'Assistant IA Étude'}
            </span>

            {!isUser && message.model && (
              <span className="message-model-tag">
                <Sparkles size={11} className="inline mr-1 text-indigo-400" />
                {providerConfig ? `${providerConfig.name} (${message.model})` : message.model}
              </span>
            )}

            <span className="message-time-text">
              {message.timestamp > 0
                ? new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'En direct'}
            </span>
          </div>

          {/* Body */}
          <div className="message-body">
            {isUser ? (
              isEditing ? (
                <>
                  <textarea
                    autoFocus
                    className="message-edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        commitEdit()
                      }
                      if (e.key === 'Escape') setIsEditing(false)
                    }}
                  />
                  <div className="message-edit-actions">
                    <button type="button" className="btn-edit-cancel" onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                    <button type="button" className="btn-edit-save" onClick={commitEdit}>
                      Envoyer
                    </button>
                  </div>
                </>
              ) : (
                <p className="user-text-content">{message.content}</p>
              )
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>

          {/* Action buttons footer */}
          {isUser && onEditMessage && !isEditing && (
            <div className="message-actions-bar">
              <button
                type="button"
                onClick={startEdit}
                disabled={disableActions}
                className="btn-msg-action"
                title="Modifier ce message et régénérer la réponse"
              >
                <Pencil size={13} />
                <span>Modifier</span>
              </button>
            </div>
          )}

          {!isUser && (
            <div className="message-actions-bar">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-msg-action"
                title="Copier toute la réponse"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copier</span>
                  </>
                )}
              </button>

              {onSaveToFlashcards && (
                <button
                  type="button"
                  onClick={handleSaveFlashcard}
                  className="btn-msg-action"
                  title="Ajouter à ma boîte de révision / Flashcards"
                >
                  {savedFlashcard ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Ajouté aux flashcards !</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={13} />
                      <span>Créer une Flashcard</span>
                    </>
                  )}
                </button>
              )}

              {isLastAssistant && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={disableActions}
                  className="btn-msg-action"
                  title="Régénérer cette réponse"
                >
                  <RefreshCw size={13} />
                  <span>Régénérer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
