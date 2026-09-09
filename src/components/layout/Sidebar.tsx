import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  MessageSquare,
  Pencil,
  Plus,
  Search,
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
  onRenameSession: (id: string, title: string) => void
  onExportBackup: () => void
  activeSubject: StudySubject
  onSelectSubject: (subject: StudySubject) => void
  isOpen: boolean
  onToggleOpen: () => void
  isMobile: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onExportBackup,
  activeSubject,
  onSelectSubject,
  isOpen,
  onToggleOpen,
  isMobile,
}) => {
  const [filterSubject, setFilterSubject] = useState<StudySubject | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const query = searchQuery.trim().toLowerCase()

  const filteredSessions = sessions.filter((s) => {
    if (filterSubject !== 'all' && s.subject !== filterSubject) return false
    if (!query) return true
    return (
      s.title.toLowerCase().includes(query) ||
      s.messages.some((m) => m.content.toLowerCase().includes(query))
    )
  })

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id)
    setEditingTitle(session.title)
  }

  const commitEditing = () => {
    if (editingId && editingTitle.trim()) {
      onRenameSession(editingId, editingTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <>
      <div
        className={`sidebar-scrim ${isMobile && isOpen ? 'visible' : ''}`}
        onClick={onToggleOpen}
      />
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

        {/* Search */}
        <div className="sidebar-search-wrap">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans l'historique..."
            className="sidebar-search-input"
          />
        </div>

        {/* Subject Filter pills */}
        <div className="sidebar-filter-section">
          <span className="sidebar-section-title">
            Filtrer par matière (active : {SUBJECTS_DATA[activeSubject]?.label || 'Toutes'})
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
              </button>
            ))}
          </div>
        </div>

        {/* History of sessions */}
        <div className="sidebar-sessions-list">
          <span className="sidebar-section-title">
            Historique ({filteredSessions.length})
          </span>

          {filteredSessions.length === 0 ? (
            <div className="empty-history-placeholder">
              <MessageSquare size={24} className="opacity-40 mb-2" />
              <p>
                {query
                  ? 'Aucun résultat pour cette recherche.'
                  : "Aucune session d'étude enregistrée pour cette sélection."}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = currentSessionId === session.id
              const subjectInfo =
                SUBJECTS_DATA[session.subject as StudySubject] || SUBJECTS_DATA.general
              const isEditing = editingId === session.id
              return (
                <div
                  key={session.id}
                  onClick={() => !isEditing && onSelectSession(session.id)}
                  className={`session-card-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="session-card-icon">
                    <span>{subjectInfo.emoji}</span>
                  </div>
                  <div className="session-card-content">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={commitEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditing()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="session-title-input"
                      />
                    ) : (
                      <h4 className="session-card-title">{session.title || "Session d'étude"}</h4>
                    )}
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
                  <div className="session-card-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(session)
                      }}
                      className="btn-icon-mini"
                      title="Renommer cette session"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      className="btn-icon-mini btn-delete-session"
                      title="Supprimer cette session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
          <button
            type="button"
            onClick={onExportBackup}
            className="btn-sidebar-secondary"
            title="Télécharger une sauvegarde de tes sessions et flashcards"
          >
            <Download size={14} />
            <span>Exporter mes données</span>
          </button>
        </div>
      </aside>
    </>
  )
}
