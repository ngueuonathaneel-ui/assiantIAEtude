export type StudyLevel = 'college' | 'lycee' | 'superieur'

export type StudySubject =
  | 'maths'
  | 'physique_chimie'
  | 'svt'
  | 'francais'
  | 'philosophie'
  | 'histoire_geo'
  | 'anglais'
  | 'informatique'
  | 'general'

export type StudyMode =
  | 'socratique'
  | 'simple'
  | 'quiz'
  | 'correction'
  | 'synthese'

export interface StudyModeInfo {
  id: StudyMode
  label: string
  shortDesc: string
  description: string
  badge: string
  icon: string
  color: string
}

export interface SubjectInfo {
  id: StudySubject
  label: string
  emoji: string
  color: string
  examples: string[]
}

export interface LevelInfo {
  id: StudyLevel
  label: string
  sublabel: string
}

export interface Flashcard {
  id: string
  subject: StudySubject
  question: string
  answer: string
  tags?: string[]
  createdAt: number
}
