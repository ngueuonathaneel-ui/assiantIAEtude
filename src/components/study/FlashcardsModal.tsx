import React, { useMemo, useState } from 'react'
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react'
import type { Flashcard, SrsRating, StudySubject } from '../../types/study'
import { SUBJECTS_DATA } from '../../services/prompts'
import { isCardDue } from '../../services/srs'
import { MarkdownRenderer } from '../chat/MarkdownRenderer'

interface FlashcardsModalProps {
  isOpen: boolean
  onClose: () => void
  flashcards: Flashcard[]
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'createdAt'>) => void
  onDeleteFlashcard: (id: string) => void
  onRateCard: (id: string, rating: SrsRating) => void
}

const RATING_LABELS: { key: SrsRating; label: string; sub: string; className: string }[] = [
  { key: 'again', label: 'À revoir', sub: '< 10 min', className: 'again' },
  { key: 'hard', label: 'Difficile', sub: '1 jour', className: 'hard' },
  { key: 'good', label: 'Correct', sub: 'quelques jours', className: 'good' },
  { key: 'easy', label: 'Facile', sub: '1+ semaine', className: 'easy' },
]

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  onAddFlashcard,
  onDeleteFlashcard,
  onRateCard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [filterSubject, setFilterSubject] = useState<StudySubject | 'all'>('all')
  const [dueOnly, setDueOnly] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newSubject, setNewSubject] = useState<StudySubject>('maths')

  const filteredCards = useMemo(() => {
    return flashcards.filter((c) => {
      if (filterSubject !== 'all' && c.subject !== filterSubject) return false
      if (dueOnly && !isCardDue(c)) return false
      return true
    })
  }, [flashcards, filterSubject, dueOnly])

  if (!isOpen) return null

  const dueCount = flashcards.filter(isCardDue).length
  const currentCard = filteredCards[Math.min(currentIndex, filteredCards.length - 1)]

  const goTo = (index: number) => {
    setIsFlipped(false)
    if (filteredCards.length === 0) {
      setCurrentIndex(0)
      return
    }
    setCurrentIndex((index + filteredCards.length) % filteredCards.length)
  }

  const handleNext = () => goTo(currentIndex + 1)
  const handlePrev = () => goTo(currentIndex - 1)

  const handleRate = (rating: SrsRating) => {
    if (!currentCard) return
    onRateCard(currentCard.id, rating)
    handleNext()
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

  const handleExportCsv = () => {
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`
    const header = 'Matière,Question,Réponse\n'
    const rows = flashcards
      .map((c) => [SUBJECTS_DATA[c.subject]?.label || c.subject, c.question, c.answer].map(escapeCsv).join(','))
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'studyai-flashcards.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container flashcards-modal-size" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ backgroundColor: '#12c48b26', color: '#12c48b' }}>
              <BookMarked size={20} />
            </div>
            <div>
              <h3>Boîte à Flashcards & Mémorisation</h3>
              <p className="modal-subtitle">
                {dueCount > 0
                  ? `${dueCount} carte${dueCount > 1 ? 's' : ''} à réviser aujourd'hui`
                  : 'Toutes les cartes sont à jour — reviens plus tard !'}
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
            <button
              type="button"
              onClick={() => {
                setDueOnly(!dueOnly)
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
              className={`flashcard-subject-pill ${dueOnly ? 'active' : ''}`}
              title="N'afficher que les cartes prêtes à être révisées"
            >
              À réviser ({dueCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-outline-small"
              title="Exporter toutes les cartes en CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="btn-create-card"
            >
              <Plus size={15} />
              <span>Créer une carte</span>
            </button>
          </div>
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
                <button type="button" onClick={() => setIsAddingNew(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-save-keys">
                  Ajouter la carte
                </button>
              </div>
            </form>
          )}

          {/* Flashcard viewer */}
          {filteredCards.length === 0 || !currentCard ? (
            <div className="flashcards-empty-state">
              <BookMarked size={40} className="opacity-30 mb-2 text-indigo-400" />
              <h4 className="font-semibold text-zinc-300">Aucune flashcard disponible</h4>
              <p className="text-xs text-zinc-400 max-w-sm text-center mt-1">
                {dueOnly
                  ? "Aucune carte n'est prête à être révisée pour cette sélection."
                  : 'Pendant ta session d\'étude, clique sur le bouton "Créer une Flashcard" sous une réponse de l\'IA pour l\'ajouter directement ici !'}
              </p>
            </div>
          ) : (
            <div className="flashcard-study-zone">
              {/* Counter */}
              <div className="flashcard-counter-badge">
                Carte {currentIndex + 1} / {filteredCards.length}
                {isCardDue(currentCard) && <span className="flashcard-due-badge">À réviser</span>}
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

              {/* Spaced-repetition rating (shown once the answer has been revealed) */}
              {isFlipped && (
                <div className="srs-rating-row">
                  {RATING_LABELS.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => handleRate(r.key)}
                      className={`btn-srs-rate ${r.className}`}
                    >
                      <span>{r.label}</span>
                      <span className="srs-sub">{r.sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation controls */}
              <div className="flashcard-nav-controls">
                <button type="button" onClick={handlePrev} className="btn-card-nav" title="Carte précédente">
                  <ChevronLeft size={18} />
                  <span>Précédente</span>
                </button>

                <button type="button" onClick={() => setIsFlipped(!isFlipped)} className="btn-card-flip">
                  <RotateCw size={16} />
                  <span>{isFlipped ? 'Masquer la réponse' : 'Afficher la réponse'}</span>
                </button>

                <button type="button" onClick={handleNext} className="btn-card-nav" title="Carte suivante">
                  <span>Suivante</span>
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDeleteFlashcard(currentCard.id)
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
