export type InterviewPreparationQuestion = {
  question: string
  tip: string
}

export type InterviewPreparation = {
  behavioralQuestions: InterviewPreparationQuestion[]
  technicalQuestions: InterviewPreparationQuestion[]
}

type SectorRule = {
  pattern: RegExp
  questions: InterviewPreparationQuestion[]
}

const behavioralQuestions: InterviewPreparationQuestion[] = [
  {
    question:
      "Présente une situation où tu as dû obtenir un résultat avec peu de moyens ou un délai serré.",
    tip:
      "Réponds avec la méthode STAR : situation, tâche, actions personnelles et résultat mesurable. Un projet d’école ou associatif est pertinent.",
  },
  {
    question:
      "Parle d’un désaccord dans une équipe et explique comment tu as aidé le groupe à avancer.",
    tip:
      "Montre ton écoute, la manière dont tu as clarifié le problème et la décision concrète prise ensemble.",
  },
  {
    question:
      "Donne un exemple d’erreur ou d’imprévu que tu as transformé en apprentissage.",
    tip:
      "Assume ta part de responsabilité, explique la correction mise en place et ce que tu ferais différemment aujourd’hui.",
  },
  {
    question:
      "Comment t’organises-tu lorsque plusieurs priorités arrivent en même temps ?",
    tip:
      "Décris un système réel : urgence, impact, dépendances, communication des délais et point de contrôle.",
  },
  {
    question:
      "Raconte une situation où tu as dû expliquer un sujet complexe à une personne non spécialiste.",
    tip:
      "Choisis un exemple concret et montre comment tu as vérifié que ton interlocuteur avait compris.",
  },
  {
    question:
      "Pourquoi ce poste et cette organisation sont-ils cohérents avec la trajectoire que tu veux construire ?",
    tip:
      "Relie deux missions précises de l’annonce à une compétence, une preuve de ton parcours et un objectif professionnel.",
  },
]

const sectorRules: SectorRule[] = [
  {
    pattern: /\b(sql|data|donn[eé]es?|power\s*bi|tableau de bord|analyste)\b/i,
    questions: [
      {
        question:
          "Comment contrôlerais-tu la qualité d’un jeu de données avant de produire un tableau de bord ?",
        tip:
          "Parle des valeurs manquantes, doublons, formats, règles métier, contrôles de cohérence et de la traçabilité de tes corrections.",
      },
      {
        question:
          "Explique comment tu transformerais une demande métier vague en indicateurs utiles.",
        tip:
          "Commence par la décision à prendre, définis les utilisateurs, les sources, la formule de chaque KPI et un rythme de validation.",
      },
      {
        question:
          "Quelle différence fais-tu entre une jointure interne et une jointure gauche en SQL ?",
        tip:
          "Donne un exemple simple avec des clients et des transactions, puis explique le risque de perdre des lignes.",
      },
    ],
  },
  {
    pattern: /\b(react|typescript|javascript|front[\s-]?end|api|d[eé]veloppeur|logiciel)\b/i,
    questions: [
      {
        question:
          "Comment construirais-tu une interface fiable sur un smartphone avec une connexion mobile instable ?",
        tip:
          "Évoque la taille des ressources, les états de chargement et d’erreur, la reprise, les formulaires courts et les tests sur de vrais appareils.",
      },
      {
        question:
          "Comment sécuriserais-tu les échanges entre une interface web et une API ?",
        tip:
          "Parle de validation côté serveur, autorisation par rôle, cookies sécurisés, protection CSRF, limitation de débit et absence de secrets côté client.",
      },
      {
        question:
          "Décris ta méthode pour diagnostiquer un défaut qui n’apparaît qu’en production.",
        tip:
          "Structure ta réponse autour de la reproduction, des journaux sans données sensibles, de l’hypothèse minimale, du correctif et du test de non-régression.",
      },
    ],
  },
  {
    pattern: /\b(qualit[eé]|agro|cacao|production|usine|tra[cç]abilit[eé]|logistique)\b/i,
    questions: [
      {
        question:
          "Comment réagirais-tu si un contrôle qualité révélait un écart juste avant une expédition ?",
        tip:
          "Explique comment isoler le lot, documenter l’écart, alerter les responsables, rechercher la cause et décider avec les critères prévus.",
      },
      {
        question:
          "Quels éléments rendent une fiche de traçabilité exploitable lors d’un audit ?",
        tip:
          "Cite l’identification du lot, les dates, responsables, contrôles, écarts, actions correctives et pièces de preuve.",
      },
      {
        question:
          "Comment ferais-tu respecter une procédure sans bloquer inutilement une équipe de production ?",
        tip:
          "Montre que tu observes le terrain, expliques le risque, proposes une solution praticable et suis son application.",
      },
    ],
  },
  {
    pattern: /\b(banque|finance|fintech|cr[eé]dit|comptab|tr[eé]sor|portefeuille)\b/i,
    questions: [
      {
        question:
          "Quels contrôles effectuerais-tu avant de présenter une analyse financière à un responsable ?",
        tip:
          "Parle des sources, rapprochements, hypothèses, périodes comparables, ordres de grandeur et validation des chiffres sensibles.",
      },
      {
        question:
          "Comment expliquerais-tu un risque financier à une PME sans utiliser de jargon ?",
        tip:
          "Pars d’un exemple de trésorerie concret, chiffre l’impact possible et termine par une action prioritaire.",
      },
      {
        question:
          "Comment protègerais-tu les informations confidentielles d’un client ?",
        tip:
          "Évoque l’accès au strict nécessaire, les canaux autorisés, la vérification du destinataire, le rangement et le signalement rapide d’un incident.",
      },
    ],
  },
  {
    pattern: /\b(marketing|communication|commercial|vente|client[eè]le|relation client)\b/i,
    questions: [
      {
        question:
          "Comment préparerais-tu une campagne destinée à des clients ivoiriens dans plusieurs villes ?",
        tip:
          "Distingue les segments, usages, langues, canaux, contraintes de connexion, messages locaux et indicateurs de conversion.",
      },
      {
        question:
          "Comment traiterais-tu une réclamation client reçue sur WhatsApp ou par téléphone ?",
        tip:
          "Décris l’écoute, la reformulation, la vérification des faits, le délai annoncé, la solution et la trace laissée dans l’outil de suivi.",
      },
      {
        question:
          "Quel indicateur utiliserais-tu pour juger une action commerciale, et pourquoi ?",
        tip:
          "Relie l’indicateur à l’objectif : prospects qualifiés, conversion, panier, rétention ou délai de traitement. Explique sa limite.",
      },
    ],
  },
]

const universalTechnicalQuestions: InterviewPreparationQuestion[] = [
  {
    question:
      "Quels seraient tes trois premiers objectifs pendant les trente premiers jours dans ce poste ?",
    tip:
      "Propose une séquence crédible : comprendre les attentes, rencontrer les interlocuteurs, maîtriser les outils puis livrer une première amélioration.",
  },
  {
    question:
      "Comment vérifierais-tu qu’un travail est terminé et répond réellement au besoin ?",
    tip:
      "Définis les critères avant d’agir, teste le résultat, demande une validation et documente les points à suivre.",
  },
  {
    question:
      "Quel outil ou quelle méthode du poste maîtrises-tu le mieux, et quelle preuve peux-tu présenter ?",
    tip:
      "Choisis une preuve vérifiable : projet, résultat, portfolio, attestation Yahnu ou démonstration. Explique aussi une limite que tu continues à travailler.",
  },
  {
    question:
      "Si une consigne te semble incomplète, quelles questions poses-tu avant de commencer ?",
    tip:
      "Clarifie le résultat attendu, l’échéance, le décideur, les données disponibles, les contraintes et le format de livraison.",
  },
]

function normalizedDescription(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000)
}

export function buildDeterministicInterviewPreparation(
  jobDescription: string,
): InterviewPreparation {
  const normalized = normalizedDescription(jobDescription)
  const matched = sectorRules
    .filter((rule) => rule.pattern.test(normalized))
    .flatMap((rule) => rule.questions)

  const uniqueTechnical = [...matched, ...universalTechnicalQuestions].filter(
    (item, index, all) =>
      all.findIndex((candidate) => candidate.question === item.question) === index,
  )

  return {
    behavioralQuestions: behavioralQuestions.slice(0, 6),
    technicalQuestions: uniqueTechnical.slice(0, 6),
  }
}
