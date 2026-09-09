import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import type { ChatSession } from '../../types/ai'
import type { StudySubject } from '../../types/study'
import { SUBJECTS_DATA } from '../../services/prompts'

interface SidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  activeSubject: StudySubject
  onSelectSubject: (subject: StudySubject) => void
  isOpen: boolean
  onToggleOpen: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  activeSubject,
  onSelectSubject,
  isOpen,
  onToggleOpen,
}) => {
  const [filterSubject, setFilterSubject] = useState<StudySubject | 'all'>('all')

  const filteredSessions = sessions.filter((s) => {
    if (filterSubject === 'all') return true
    return s.subject === filterSubject
  })

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Top action bar */}
      <div className="sidebar-top">
        <button
          type="button"
          onClick={onNewSession}
          className="btn-new-chat"
          title="Démarrer une nouvelle session d'étude"
        >
          <Plus size={18} />
          <span>Nouvelle étude</span>
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          className="btn-collapse-sidebar"
          title={isOpen ? 'Replier le menu' : 'Déplier le menu'}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Subject Filter pills */}
      <div className="sidebar-filter-section">
        <span className="sidebar-section-title">
          Filtrer par matière (active: {SUBJECTS_DATA[activeSubject]?.label || 'Toutes'}) :
        </span>
        <div className="sidebar-subjects-chips">
          <button
            type="button"
            onClick={() => setFilterSubject('all')}
            className={`subject-chip-btn ${filterSubject === 'all' ? 'active' : ''}`}
          >
            Toutes
          </button>
          {Object.values(SUBJECTS_DATA).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setFilterSubject(s.id)
                onSelectSubject(s.id)
              }}
              className={`subject-chip-btn ${
                filterSubject === s.id || (filterSubject === 'all' && activeSubject === s.id)
                  ? 'active'
                  : ''
              }`}
              title={s.label}
            >
              <span>{s.emoji}</span>
              <span className="chip-label-text">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* History of sessions */}
      <div className="sidebar-sessions-list">
        <span className="sidebar-section-title">
          Historique ({filteredSessions.length}) :
        </span>

        {filteredSessions.length === 0 ? (
          <div className="empty-history-placeholder">
            <MessageSquare size={24} className="opacity-40 mb-2" />
            <p>Aucune session d'étude enregistrée pour cette sélection.</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = currentSessionId === session.id
            const subjectInfo =
              SUBJECTS_DATA[session.subject as StudySubject] || SUBJECTS_DATA.general
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`session-card-item ${isSelected ? 'selected' : ''}`}
              >
                <div className="session-card-icon">
                  <span>{subjectInfo.emoji}</span>
                </div>
                <div className="session-card-content">
                  <h4 className="session-card-title">{session.title || 'Session d’étude'}</h4>
                  <div className="session-card-meta">
                    <span className="session-meta-subject">{subjectInfo.label}</span>
                    <span className="session-meta-time">
                      {new Date(session.updatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  className="btn-delete-session"
                  title="Supprimer cette session"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Sidebar bottom student card */}
      <div className="sidebar-footer">
        <div className="student-profile-badge">
          <GraduationCap size={18} className="text-indigo-400" />
          <div className="student-profile-text">
            <span className="font-semibold text-xs text-zinc-200">Espace Travail & Révisions</span>
            <span className="text-[10px] text-zinc-400">Progression continue</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
