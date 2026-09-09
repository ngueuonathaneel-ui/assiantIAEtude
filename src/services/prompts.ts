import type {
  LevelInfo,
  StudyLevel,
  StudyMode,
  StudyModeInfo,
  StudySubject,
  SubjectInfo,
} from '../types/study'

export type {
  LevelInfo,
  StudyLevel,
  StudyMode,
  StudyModeInfo,
  StudySubject,
  SubjectInfo,
}

export const SUBJECTS_DATA: Record<StudySubject, SubjectInfo> = {
  general: {
    id: 'general',
    label: 'Toutes Matières',
    emoji: '🎓',
    color: '#6366f1',
    examples: [
      'Aide-moi à organiser mes révisions pour le brevet/bac',
      'Comment apprendre par cœur plus efficacement ?',
      'Explique-moi la méthode de la dissertation',
    ],
  },
  maths: {
    id: 'maths',
    label: 'Mathématiques',
    emoji: '📐',
    color: '#0284c7',
    examples: [
      'Explique-moi le théorème de Pythagore avec un exemple concret',
      'Comment résoudre une équation du second degré $ax^2 + bx + c = 0$ ?',
      'Donne-moi un exercice guidé sur les dérivées',
    ],
  },
  physique_chimie: {
    id: 'physique_chimie',
    label: 'Physique - Chimie',
    emoji: '⚡',
    color: '#0d9488',
    examples: [
      'Explique-moi la loi d’Ohm et la puissance électrique',
      'Quelle est la différence entre une transformation physique et chimique ?',
      'Comment équilibrer une équation de réaction chimique ?',
    ],
  },
  svt: {
    id: 'svt',
    label: 'SVT (Sciences de la Vie)',
    emoji: '🧬',
    color: '#16a34a',
    examples: [
      'Explique-moi la mitose et la méiose simplement',
      'Comment fonctionne le système immunitaire face à un virus ?',
      'Fais-moi une synthèse sur la tectonique des plaques',
    ],
  },
  francais: {
    id: 'francais',
    label: 'Français & Lettres',
    emoji: '📚',
    color: '#e11d48',
    examples: [
      'Quelles sont les principales figures de style avec des exemples ?',
      'Comment rédiger une introduction de commentaire littéraire ?',
      'Analyse ce poème et dégage les axes principaux',
    ],
  },
  histoire_geo: {
    id: 'histoire_geo',
    label: 'Histoire - Géographie',
    emoji: '🌍',
    color: '#d97706',
    examples: [
      'Fais-moi une frise chronologique de la Seconde Guerre Mondiale',
      'Quels sont les enjeux de la mondialisation actuelle ?',
      'Quiz de 5 questions sur la Révolution Française',
    ],
  },
  philosophie: {
    id: 'philosophie',
    label: 'Philosophie',
    emoji: '🏛️',
    color: '#9333ea',
    examples: [
      'La liberté consiste-t-elle à faire ce qui nous plaît ?',
      'Explique-moi le mythe de la caverne de Platon',
      'Comment problématiser un sujet de dissertation ?',
    ],
  },
  anglais: {
    id: 'anglais',
    label: 'Anglais & Langues',
    emoji: '🇬🇧',
    color: '#2563eb',
    examples: [
      'Quand utiliser le Present Perfect vs le Past Simple ?',
      'Simule une conversation d’entraînement pour un oral',
      'Corrige mon texte en m’expliquant mes erreurs de grammaire',
    ],
  },
  informatique: {
    id: 'informatique',
    label: 'Informatique & NSI',
    emoji: '💻',
    color: '#059669',
    examples: [
      'Explique-moi la récursivité en Python avec un schéma mental',
      'Comment fonctionne l’algorithme de recherche dichotomique ?',
      'Débogue mon code et explique pourquoi il boucle à l’infini',
    ],
  },
}

export const STUDY_MODES_DATA: Record<StudyMode, StudyModeInfo> = {
  socratique: {
    id: 'socratique',
    label: 'Tuteur Socratique',
    shortDesc: 'Guidage pas-à-pas sans donner la réponse directe',
    description: 'L’IA ne te donne pas la réponse directement, elle te pose des questions et te donne des indices pour t’aider à comprendre par toi-même.',
    badge: 'Apprentissage actif',
    icon: 'Compass',
    color: '#8b5cf6',
  },
  simple: {
    id: 'simple',
    label: 'Explication Simple',
    shortDesc: 'Vulgarisation claire avec métaphores du quotidien',
    description: 'Une explication ultra-visuelle et facile à comprendre, avec des comparaisons concrètes de la vie de tous les jours.',
    badge: 'Compréhension intuitive',
    icon: 'Lightbulb',
    color: '#f59e0b',
  },
  quiz: {
    id: 'quiz',
    label: 'Quiz & Flashcards',
    shortDesc: 'Questions d’entraînement pour tester tes connaissances',
    description: 'L’IA te propose des questions sous forme de QCM ou questions flash pour vérifier que tu as bien retenu ta leçon.',
    badge: 'Auto-évaluation',
    icon: 'CheckSquare',
    color: '#10b981',
  },
  correction: {
    id: 'correction',
    label: 'Correction & Méthode',
    shortDesc: 'Analyse d’exercice et méthode de résolution détaillée',
    description: 'Partage ton exercice ou ton brouillon : l’IA repère tes erreurs et t’explique la méthode rigoureuse pour réussir.',
    badge: 'Méthodologie',
    icon: 'FileSearch',
    color: '#ef4444',
  },
  synthese: {
    id: 'synthese',
    label: 'Fiche de Révision',
    shortDesc: 'Résumé structuré avec notions clés et formules',
    description: 'Génère une fiche de cours condensée avec définitions clés, formules essentielles et pièges classiques à éviter.',
    badge: 'Mémorisation',
    icon: 'BookOpen',
    color: '#3b82f6',
  },
}

export const LEVELS_DATA: Record<StudyLevel, LevelInfo> = {
  college: {
    id: 'college',
    label: 'Collège',
    sublabel: 'De la 6ème à la 3ème (Brevet)',
  },
  lycee: {
    id: 'lycee',
    label: 'Lycée',
    sublabel: 'Seconde, Première, Terminale (Bac)',
  },
  superieur: {
    id: 'superieur',
    label: 'Supérieur',
    sublabel: 'Université, Prépa, BTS/BUT, Grandes Écoles',
  },
}

export function buildSystemPrompt(options: {
  subject: StudySubject
  level: StudyLevel
  mode: StudyMode
}): string {
  const { subject, level, mode } = options
  const subjectInfo = SUBJECTS_DATA[subject] || SUBJECTS_DATA.general
  const levelInfo = LEVELS_DATA[level] || LEVELS_DATA.lycee

  let modeInstructions = ''
  switch (mode) {
    case 'socratique':
      modeInstructions = `
MODE D'ÉTUDE : TUTEUR SOCRATIQUE INTERACTIF
- RÈGLE ABSOLUE : Ne donne JAMAIS la réponse finale ou la solution complète dès la première réponse.
- Pose des questions guidées et progressives pour amener l'élève à réfléchir.
- Donne de petits indices ciblés si l'élève hésite ou bloque.
- Félicite chaleureusement les bonnes déductions et reformule pour ancrer l'apprentissage.
- Si l'élève te donne une réponse erronée, demande-lui doucement de vérifier un point précis de son raisonnement.`
      break

    case 'simple':
      modeInstructions = `
MODE D'ÉTUDE : VULGARISATION ET EXPLICATION SIMPLE
- Explique comme un grand frère ou un professeur passionnant et bienveillant.
- Utilise des analogies de la vie quotidienne concrètes, visuelles et intuitives.
- Décompose chaque concept complexe en 3 à 4 petites étapes faciles à assimiler.
- Définis chaque terme technique immédiatement en langage clair.`
      break

    case 'quiz':
      modeInstructions = `
MODE D'ÉTUDE : QUIZ ET ENTRAÎNEMENT INTERACTIF
- Propose des questions interactives (QCM à 4 choix ou questions ouvertes flash).
- Formate clairement :
  * Énonce la question de manière attrayante.
  * Masque ou sépare la réponse pour permettre à l'élève de réfléchir avant de regarder.
  * Fournis une explication pédagogique du "pourquoi" après la réponse.
- Encourage l'élève et propose une question suivante au bon niveau de difficulté.`
      break

    case 'correction':
      modeInstructions = `
MODE D'ÉTUDE : CORRECTION ET ANALYSE MÉTHODOLOGIQUE
- Décortique rigoureusement le problème ou l'exercice posé.
- Identifie les pièges fréquents à éviter.
- Structure la réponse selon les standards académiques :
  1. Données / Ce qu'on sait
  2. Propriété, théorème ou formule applicable
  3. Calculs et étapes détaillés
  4. Conclusion ou phrase réponse claire.`
      break

    case 'synthese':
      modeInstructions = `
MODE D'ÉTUDE : FICHE DE RÉVISION & SYNTHÈSE COMPLÈTE
- Organise la réponse comme une fiche mémo visuelle parfaite à imprimer ou relire avant un contrôle :
  * 🎯 **Objectif du chapitre**
  * 📌 **Définitions clés indispensables**
  * 📐 **Formules et propriétés fondamentales** (bien mises en valeur)
  * 💡 **Exemple type d'application**
  * ⚠️ **Pièges classiques à éviter en contrôle**`
      break
  }

  return `Tu es un Assistant IA d'Aide d'Étude d'Excellence, bienveillant, rigoureux et stimulant.
Tu accompagnes un élève de niveau : ${levelInfo.label} (${levelInfo.sublabel}).
Matière actuelle : ${subjectInfo.label}.

${modeInstructions}

DIRECTIVES DE FORMATAGE EN MARKDOWN RICHE :
1. Structure toujours tes réponses avec une belle mise en page Markdown :
   - Titres de sections clairs (## et ###).
   - Listes à puces et listes numérotées bien aérées.
   - Mots clés importants en **gras**.
   - Tableaux Markdown (| Colonne 1 | Colonne 2 |) pour comparer ou récapituler.
2. FORMULES MATHÉMATIQUES ET SCIENTIFIQUES (OBLIGATOIRE) :
   - Utilise KaTeX au format LaTeX standard.
   - En ligne : utilise des dollars simples, par exemple : $f(x) = ax^2 + bx + c$, $\\Delta = b^2 - 4ac$, $v = \\frac{d}{t}$.
   - En bloc centré pour les équations majeures : utilise des doubles dollars, par exemple :
     $$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$
     $$E = mc^2$$
3. ENCADRÉS PÉDAGOGIQUES :
   - Utilise les citations Markdown (blockquote) avec des icônes pour mettre en valeur les points cruciaux :
     > **💡 Astuce pratique :** ...
     > **⚠️ Piège fréquent :** ...
     > **📌 Règle à retenir :** ...
4. CODE ET INFORMATIQUE :
   - Utilise des blocs de code avec coloration syntaxique (\`\`\`python, \`\`\`javascript, etc.).

Adapte toujours ton vocabulaire et ta complexité au niveau de l'élève (${levelInfo.label}). Reste toujours positif, motivant et constructif !`
}
