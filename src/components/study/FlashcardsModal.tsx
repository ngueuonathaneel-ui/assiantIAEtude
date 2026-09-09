import React, { useState } from 'react'
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react'
import type { Flashcard, StudySubject } from '../../types/study'
import { SUBJECTS_DATA } from '../../services/prompts'
import { MarkdownRenderer } from '../chat/MarkdownRenderer'

interface FlashcardsModalProps {
  isOpen: boolean
  onClose: () => void
  flashcards: Flashcard[]
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'createdAt'>) => void
  onDeleteFlashcard: (id: string) => void
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  onAddFlashcard,
  onDeleteFlashcard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [filterSubject, setFilterSubject] = useState<StudySubject | 'all'>('all')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newSubject, setNewSubject] = useState<StudySubject>('maths')

  if (!isOpen) return null

  const filteredCards = flashcards.filter((c) => {
    if (filterSubject === 'all') return true
    return c.subject === filterSubject
  })

  const currentCard = filteredCards[currentIndex]

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
  }

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim() || !newAnswer.trim()) return
    onAddFlashcard({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      subject: newSubject,
    })
    setNewQuestion('')
    setNewAnswer('')
    setIsAddingNew(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container flashcards-modal-size" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ backgroundColor: '#10b98126', color: '#10b981' }}>
              <BookMarked size={20} />
            </div>
            <div>
              <h3>Boîte à Flashcards & Mémorisation</h3>
              <p className="modal-subtitle">
                Révise tes formules, définitions et repères avec le retournement interactif
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-close">
            <X size={20} />
          </button>
        </div>

        {/* Filters and Add button */}
        <div className="flashcards-top-bar">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setFilterSubject('all')
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
              className={`flashcard-subject-pill ${filterSubject === 'all' ? 'active' : ''}`}
            >
              Toutes ({flashcards.length})
            </button>
            {Object.values(SUBJECTS_DATA).map((s) => {
              const count = flashcards.filter((c) => c.subject === s.id).length
              if (count === 0 && filterSubject !== s.id) return null
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setFilterSubject(s.id)
                    setCurrentIndex(0)
                    setIsFlipped(false)
                  }}
                  className={`flashcard-subject-pill ${filterSubject === s.id ? 'active' : ''}`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label} ({count})</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="btn-create-card"
          >
            <Plus size={15} />
            <span>Créer une carte</span>
          </button>
        </div>

        {/* Modal body */}
        <div className="modal-body">
          {/* New Card Form */}
          {isAddingNew && (
            <form onSubmit={handleCreateCard} className="new-card-form">
              <h4 className="font-semibold text-sm mb-2 text-indigo-300">
                Ajouter une carte mémo manuellement
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="form-label">Matière :</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as StudySubject)}
                    className="header-select w-full"
                  >
                    {Object.values(SUBJECTS_DATA).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Question / Formule / Notion (Face avant) :</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ex: Théorème de Thalès ou Date de la prise de la Bastille"
                  className="input-api-key w-full"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Réponse / Démonstration (Face arrière) :</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Explication détaillée, formule LaTeX, etc."
                  rows={3}
                  className="chat-textarea w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-save-keys">
                  Ajouter la carte
                </button>
              </div>
            </form>
          )}

          {/* Flashcard viewer */}
          {filteredCards.length === 0 ? (
            <div className="flashcards-empty-state">
              <BookMarked size={40} className="opacity-30 mb-2 text-indigo-400" />
              <h4 className="font-semibold text-zinc-300">Aucune flashcard disponible</h4>
              <p className="text-xs text-zinc-400 max-w-sm text-center mt-1">
                Pendant ta session d'étude, clique sur le bouton "Créer une Flashcard" sous une
                réponse de l'IA pour l'ajouter directement ici !
              </p>
            </div>
          ) : (
            <div className="flashcard-study-zone">
              {/* Counter */}
              <div className="flashcard-counter-badge">
                Carte {currentIndex + 1} / {filteredCards.length}
              </div>

              {/* Flippable Card */}
              <div
                className={`flashcard-card-box ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-inner">
                  {/* Front */}
                  <div className="flashcard-face flashcard-front">
                    <span className="card-side-tag">Question (Clique pour voir la réponse)</span>
                    <h3 className="card-question-text">{currentCard.question}</h3>
                    <div className="card-flip-prompt">
                      <RotateCw size={14} />
                      <span>Tourner la carte</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="flashcard-face flashcard-back">
                    <span className="card-side-tag">Réponse détaillée</span>
                    <div className="card-answer-scroll">
                      <MarkdownRenderer content={currentCard.answer} />
                    </div>
                    <div className="card-flip-prompt">
                      <RotateCw size={14} />
                      <span>Retourner</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flashcard-nav-controls">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-card-nav"
                  title="Carte précédente"
                >
                  <ChevronLeft size={18} />
                  <span>Précédente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="btn-card-flip"
                >
                  <RotateCw size={16} />
                  <span>{isFlipped ? 'Masquer la réponse' : 'Afficher la réponse'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-card-nav"
                  title="Carte suivante"
                >
                  <span>Suivante</span>
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDeleteFlashcard(currentCard.id)
                    if (currentIndex > 0 && currentIndex >= filteredCards.length - 1) {
                      setCurrentIndex(currentIndex - 1)
                    }
                  }}
                  className="btn-card-delete"
                  title="Supprimer cette carte"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
