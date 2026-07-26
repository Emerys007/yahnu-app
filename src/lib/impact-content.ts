export type ImpactMetric = {
  value: string;
  label: string;
  detail: string;
};

export type ImpactLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  metrics: ImpactMetric[];
  methodologyTitle: string;
  methodologyBody: string;
  reportingCadence: string;
  currentStatus: string;
};

export type ImpactPageContent = {
  fr: ImpactLocaleContent;
  en: ImpactLocaleContent;
};

export const impactTargetDisclaimer = {
  fr: "Cibles proposées pour la phase pilote 2026 — pas des résultats observés",
  en: "Proposed 2026 pilot targets — not observed results",
} as const;

export const defaultImpactPageContent: ImpactPageContent = {
  fr: {
    heroTitle: "Mesurer ce qui change vraiment entre le diplôme et l’emploi.",
    heroSubtitle:
      "La phase pilote Yahnu 2026 transforme des intentions partagées en objectifs suivis, des indicateurs compréhensibles et des décisions utiles.",
    metrics: [
      {
        value: "500",
        label: "jeunes accompagnés",
        detail: "Profils activés et parcours suivis pendant la phase pilote.",
      },
      {
        value: "12",
        label: "établissements mobilisés",
        detail: "Écoles et universités engagées dans le suivi post-diplôme.",
      },
      {
        value: "25",
        label: "employeurs participants",
        detail: "Entreprises publiant des besoins clairs ou contribuant au pilote.",
      },
      {
        value: "80 %",
        label: "de candidatures avec retour",
        detail: "Cible de réponse ou de changement de statut sous quatorze jours.",
      },
    ],
    methodologyTitle: "Une mesure utile, proportionnée et lisible.",
    methodologyBody:
      "Yahnu suit les étapes du parcours — activation du profil, candidature, retour, entretien et résultat déclaré — puis croise ces signaux avec les retours des jeunes, établissements et employeurs. Les données sont agrégées pour le pilotage et minimisées pour protéger les participants.",
    reportingCadence:
      "Tableau de bord opérationnel mensuel, revue trimestrielle avec les partenaires du pilote et note publique semestrielle.",
    currentStatus:
      "Résultats à venir : les premiers résultats seront publiés après validation méthodologique du pilote.",
  },
  en: {
    heroTitle: "Measure what genuinely changes between graduation and work.",
    heroSubtitle:
      "Yahnu’s 2026 pilot turns shared intentions into monitored objectives, understandable indicators and useful decisions.",
    metrics: [
      {
        value: "500",
        label: "young people supported",
        detail: "Activated profiles and journeys followed during the pilot.",
      },
      {
        value: "12",
        label: "institutions engaged",
        detail: "Schools and universities involved in post-graduation follow-up.",
      },
      {
        value: "25",
        label: "participating employers",
        detail: "Employers publishing clear needs or contributing to the pilot.",
      },
      {
        value: "80%",
        label: "applications with an update",
        detail: "Target for a response or status change within fourteen days.",
      },
    ],
    methodologyTitle: "Measurement that is useful, proportionate and readable.",
    methodologyBody:
      "Yahnu follows key journey stages—profile activation, application, response, interview and declared result—then combines those signals with feedback from graduates, institutions and employers. Data is aggregated for steering and minimised to protect participants.",
    reportingCadence:
      "Monthly operational dashboard, quarterly review with pilot partners and a public note every six months.",
    currentStatus:
      "Results to come: the first results will be published after the pilot methodology has been validated.",
  },
};
