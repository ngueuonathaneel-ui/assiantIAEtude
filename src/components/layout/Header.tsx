import React, { useEffect, useState } from 'react'
import {
  BookMarked,
  Check,
  ChevronDown,
  GraduationCap,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react'
import type { ApiKeysState, ProviderId } from '../../types/ai'
import type { StudyLevel, StudyMode, StudySubject } from '../../types/study'
import { getProviderConfig, getAllProviders } from '../../services/ai/models'
import {
  LEVELS_DATA,
  STUDY_MODES_DATA,
  SUBJECTS_DATA,
} from '../../services/prompts'

interface HeaderProps {
  activeProvider: ProviderId
  onChangeProvider: (p: ProviderId) => void
  activeModel: string
  onChangeModel: (m: string) => void
  activeSubject: StudySubject
  onChangeSubject: (s: StudySubject) => void
  activeLevel: StudyLevel
  onChangeLevel: (l: StudyLevel) => void
  activeMode: StudyMode
  onChangeMode: (m: StudyMode) => void
  keys: ApiKeysState
  onOpenSettings: () => void
  onOpenFlashcards: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeProvider,
  onChangeProvider,
  activeModel,
  onChangeModel,
  activeSubject,
  onChangeSubject,
  activeLevel,
  onChangeLevel,
  activeMode,
  onChangeMode,
  keys,
  onOpenSettings,
  onOpenFlashcards,
  darkMode,
  onToggleDarkMode,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showSubjectMenu, setShowSubjectMenu] = useState(false)
  const [isCustomModelInput, setIsCustomModelInput] = useState(false)
  const [customModelText, setCustomModelText] = useState('')

  const providers = getAllProviders()
  const currentProvider = getProviderConfig(activeProvider)
  const hasKey = !!keys[activeProvider] || activeProvider === 'opencode'

  const currentSubject = SUBJECTS_DATA[activeSubject] || SUBJECTS_DATA.general

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.relative-container')) {
        setShowModelMenu(false)
        setShowSubjectMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleApplyCustomModel = (e: React.FormEvent) => {
    e.preventDefault()
    if (customModelText.trim()) {
      onChangeModel(customModelText.trim())
      setIsCustomModelInput(false)
      setShowModelMenu(false)
    }
  }

  return (
    <header className="app-header">
      {/* Brand & Tagline */}
      <div className="header-left">
        <div className="logo-brand">
          <div className="logo-icon-bg">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="logo-title">
              Study<span className="logo-highlight">AI</span>
            </h1>
            <span className="logo-badge">Assistant Élève</span>
          </div>
        </div>

        {/* Level Selector */}
        <div className="level-pills-group">
          {(['college', 'lycee', 'superieur'] as StudyLevel[]).map((lvl) => {
            const info = LEVELS_DATA[lvl]
            const isSelected = activeLevel === lvl
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onChangeLevel(lvl)}
                className={`level-pill-btn ${isSelected ? 'active' : ''}`}
                title={info.sublabel}
              >
                {info.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Center Controls: Subject & Mode */}
      <div className="header-center">
        {/* Subject dropdown */}
        <div className="relative-container">
          <button
            type="button"
            onClick={() => setShowSubjectMenu(!showSubjectMenu)}
            className="selector-button subject-btn"
          >
            <span>{currentSubject.emoji}</span>
            <span className="font-semibold text-sm">{currentSubject.label}</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>

          {showSubjectMenu && (
            <div className="dropdown-menu dropdown-subjects">
              <div className="dropdown-title">Choisir une matière :</div>
              {Object.values(SUBJECTS_DATA).map((subj) => (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => {
                    onChangeSubject(subj.id)
                    setShowSubjectMenu(false)
                  }}
                  className={`dropdown-item ${activeSubject === subj.id ? 'active' : ''}`}
                >
                  <span className="text-base">{subj.emoji}</span>
                  <span className="flex-1 text-left">{subj.label}</span>
                  {activeSubject === subj.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Study Mode Quick Bar */}
        <div className="mode-quick-pills">
          {(['socratique', 'simple', 'quiz', 'synthese'] as StudyMode[]).map((m) => {
            const mInfo = STUDY_MODES_DATA[m]
            const isSelected = activeMode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => onChangeMode(m)}
                className={`mode-quick-pill ${isSelected ? 'active' : ''}`}
                title={mInfo.description}
              >
                {mInfo.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Controls: Provider & Models selection + Settings */}
      <div className="header-right">
        {/* Provider Selector */}
        <div className="provider-select-wrapper">
          <select
            value={activeProvider}
            onChange={(e) => {
              const newProv = e.target.value as ProviderId
              onChangeProvider(newProv)
              onChangeModel(getProviderConfig(newProv).defaultModel)
            }}
            className="header-select provider-select"
            title="Choisir le fournisseur d'IA"
          >
            {providers.map((p) => {
              const icons: Record<string, string> = {
                gemini: '✨',
                mistral: '🔥',
                openai: '⚡',
                anthropic: '🧠',
                openrouter: '🌐',
                opencode: '💻',
              }
              return (
                <option key={p.id} value={p.id}>
                  {icons[p.id] || '🤖'} {p.name}
                </option>
              )
            })}
          </select>
        </div>

        {/* Model Selector Menu with ALL models */}
        <div className="relative-container">
          <button
            type="button"
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="selector-button model-selector-btn"
            title="Choisir parmi tous les modèles disponibles"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="model-name-text">{activeModel}</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>

          {showModelMenu && (
            <div className="dropdown-menu dropdown-models">
              <div className="dropdown-title flex justify-between items-center">
                <span>Modèles disponibles ({currentProvider.name})</span>
              </div>

              <div className="models-scroll-list">
                {currentProvider.models.map((modelItem) => {
                  const isSelected = activeModel === modelItem.id
                  return (
                    <button
                      key={modelItem.id}
                      type="button"
                      onClick={() => {
                        onChangeModel(modelItem.id)
                        setShowModelMenu(false)
                        setIsCustomModelInput(false)
                      }}
                      className={`dropdown-model-item ${isSelected ? 'active' : ''}`}
                    >
                      <div className="model-item-top">
                        <span className="font-semibold text-sm">{modelItem.name}</span>
                        {modelItem.badge && (
                          <span className="model-item-badge">{modelItem.badge}</span>
                        )}
                      </div>
                      <p className="model-item-desc">{modelItem.description}</p>
                      <span className="model-item-id">ID: {modelItem.id}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom Model Option */}
              <div className="custom-model-box">
                {!isCustomModelInput ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomModelInput(true)}
                    className="btn-add-custom-model"
                  >
                    <Plus size={14} />
                    <span>Spécifier un autre modèle personnalisé...</span>
                  </button>
                ) : (
                  <form onSubmit={handleApplyCustomModel} className="custom-model-form">
                    <input
                      type="text"
                      value={customModelText}
                      onChange={(e) => setCustomModelText(e.target.value)}
                      placeholder="Ex: gpt-4.5-preview, mistral-embed..."
                      className="input-custom-model"
                      autoFocus
                    />
                    <div className="flex gap-1 mt-1">
                      <button type="submit" className="btn-apply-custom">
                        Appliquer
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomModelInput(false)}
                        className="btn-cancel-custom"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* API Key Status Pill */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`key-status-indicator ${hasKey ? 'configured' : 'missing'}`}
          title={
            hasKey
              ? `Clé ${currentProvider.name} active et configurée`
              : `Clé ${currentProvider.name} manquante - Cliquer pour configurer`
          }
        >
          <span className="status-dot" />
          <span className="status-text">{hasKey ? 'Clé Active' : 'Configurer Clé'}</span>
        </button>

        {/* Flashcard viewer button */}
        <button
          type="button"
          onClick={onOpenFlashcards}
          className="header-icon-btn"
          title="Boîte à Flashcards & Quiz"
        >
          <BookMarked size={18} />
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="header-icon-btn"
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="header-icon-btn settings-btn"
          title="Paramètres des clés d'API"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
