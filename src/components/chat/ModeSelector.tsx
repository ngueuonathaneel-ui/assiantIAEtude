import React from 'react'
import {
  BookOpen,
  CheckSquare,
  Compass,
  FileSearch,
  Lightbulb,
} from 'lucide-react'
import { STUDY_MODES_DATA } from '../../services/prompts'
import type { StudyMode } from '../../types/study'

interface ModeSelectorProps {
  activeMode: StudyMode
  onSelectMode: (mode: StudyMode) => void
}

const MODE_ICONS: Record<StudyMode, React.ReactNode> = {
  socratique: <Compass size={16} />,
  simple: <Lightbulb size={16} />,
  quiz: <CheckSquare size={16} />,
  correction: <FileSearch size={16} />,
  synthese: <BookOpen size={16} />,
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelectMode }) => {
  const currentModeInfo = STUDY_MODES_DATA[activeMode]

  return (
    <div className="mode-selector-wrapper">
      <div className="mode-selector-tabs">
        {(Object.keys(STUDY_MODES_DATA) as StudyMode[]).map((modeKey) => {
          const modeInfo = STUDY_MODES_DATA[modeKey]
          const isSelected = activeMode === modeKey
          return (
            <button
              key={modeKey}
              type="button"
              onClick={() => onSelectMode(modeKey)}
              className={`mode-tab-button ${isSelected ? 'active' : ''}`}
            >
              <span className="mode-tab-icon" style={{ color: modeInfo.color }}>
                {MODE_ICONS[modeKey]}
              </span>
              <span className="mode-tab-label">{modeInfo.label}</span>
              {isSelected && <span className="mode-tab-pill">{modeInfo.badge}</span>}
            </button>
          )
        })}
      </div>

      <div className="mode-current-desc">
        <span className="font-semibold text-xs text-indigo-400">
          {currentModeInfo.label} :
        </span>
        <span className="text-xs text-zinc-300 ml-1.5">{currentModeInfo.description}</span>
      </div>
    </div>
  )
}
