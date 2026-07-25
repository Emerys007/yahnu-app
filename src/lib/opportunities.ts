export type Opportunity = {
  slug: string;
  href: string;
  illustrative: true;
  title: { en: string; fr: string };
  company: string;
  location: { en: string; fr: string };
  country: "Côte d’Ivoire";
  workplace: "remote" | "hybrid" | "on-site";
  type: { en: string; fr: string };
  category: { en: string; fr: string };
  posted: string;
  featured?: boolean;
  tags: string[];
  summary: { en: string; fr: string };
  responsibilities: { en: string[]; fr: string[] };
};

// These fictional listings demonstrate Yahnu's opportunity experience without
// implying a commercial relationship with a real employer. Their href values
// lead to the live jobs search instead of a non-existent application page.
export const opportunities: Opportunity[] = [
  {
    slug: "assistant-developpeur-mobile-lagune-labs",
    href: "/jobs?q=développeur%20mobile",
    illustrative: true,
    title: { en: "Junior Mobile Developer", fr: "Développeur mobile junior" },
    company: "Lagune Labs · entreprise fictive",
    location: { en: "Cocody, Abidjan", fr: "Cocody, Abidjan" },
    country: "Côte d’Ivoire",
    workplace: "hybrid",
    type: { en: "Graduate internship", fr: "Stage de fin d’études" },
    category: { en: "Technology", fr: "Technologie" },
    posted: "2026-07-12",
    featured: true,
    tags: ["React Native", "API", "Mobile Money", "Git"],
    summary: {
      en: "Help an Abidjan product team prototype simple mobile services designed for everyday life in Côte d’Ivoire.",
      fr: "Aidez une équipe produit à Abidjan à prototyper des services mobiles simples, pensés pour le quotidien en Côte d’Ivoire.",
    },
    responsibilities: {
      en: [
        "Build and test accessible mobile screens with a mentor.",
        "Connect product flows to documented APIs.",
        "Share a concise weekly demo with the product team.",
      ],
      fr: [
        "Développer et tester des écrans mobiles accessibles avec un mentor.",
        "Connecter les parcours produit à des API documentées.",
        "Présenter une démonstration concise chaque semaine à l’équipe produit.",
      ],
    },
  },
  {
    slug: "analyste-data-junior-datalab-ebrie",
    href: "/jobs?q=analyste%20data",
    illustrative: true,
    title: { en: "Junior Data Analyst", fr: "Analyste data junior" },
    company: "Datalab Ébrié · entreprise fictive",
    location: { en: "Plateau, Abidjan", fr: "Plateau, Abidjan" },
    country: "Côte d’Ivoire",
    workplace: "on-site",
    type: { en: "Fixed-term contract", fr: "CDD" },
    category: { en: "Data & Analytics", fr: "Données & analytique" },
    posted: "2026-07-10",
    featured: true,
    tags: ["Excel", "SQL", "Power BI", "Reporting"],
    summary: {
      en: "Turn operational data into clear dashboards that help local teams make faster, better-informed decisions.",
      fr: "Transformez des données opérationnelles en tableaux de bord clairs pour aider des équipes locales à décider plus vite.",
    },
    responsibilities: {
      en: [
        "Clean recurring datasets and document quality checks.",
        "Build decision-ready dashboards in Power BI.",
        "Explain findings in clear French to non-technical teams.",
      ],
      fr: [
        "Nettoyer les jeux de données récurrents et documenter les contrôles qualité.",
        "Construire des tableaux de bord directement exploitables dans Power BI.",
        "Expliquer les résultats en français clair aux équipes non techniques.",
      ],
    },
  },
  {
    slug: "ingenieur-agronome-junior-terres-belier",
    href: "/jobs?q=agronome",
    illustrative: true,
    title: { en: "Junior Agronomist", fr: "Ingénieur agronome junior" },
    company: "Terres du Bélier · entreprise fictive",
    location: { en: "Yamoussoukro, Bélier", fr: "Yamoussoukro, Bélier" },
    country: "Côte d’Ivoire",
    workplace: "on-site",
    type: { en: "Full-time", fr: "Temps plein" },
    category: { en: "Agriculture", fr: "Agriculture" },
    posted: "2026-07-08",
    featured: true,
    tags: ["Agronomy", "Field operations", "Cocoa", "Sustainability"],
    summary: {
      en: "Support field teams and producers with practical observations that improve crop quality and resilience.",
      fr: "Accompagnez les équipes terrain et les producteurs avec des observations concrètes qui renforcent qualité et résilience des cultures.",
    },
    responsibilities: {
      en: [
        "Collect structured observations during field visits.",
        "Help deliver sustainable crop-management workshops.",
        "Prepare practical follow-up notes for producer groups.",
      ],
      fr: [
        "Recueillir des observations structurées lors des visites terrain.",
        "Participer à des ateliers sur la gestion durable des cultures.",
        "Préparer des notes de suivi pratiques pour les groupements de producteurs.",
      ],
    },
  },
  {
    slug: "designer-produit-junior-nzassa-studio",
    href: "/jobs?q=designer%20produit",
    illustrative: true,
    title: { en: "Junior Product Designer", fr: "Designer produit junior" },
    company: "N’Zassa Studio · entreprise fictive",
    location: { en: "Remote within Côte d’Ivoire", fr: "À distance en Côte d’Ivoire" },
    country: "Côte d’Ivoire",
    workplace: "remote",
    type: { en: "Fixed-term contract", fr: "CDD" },
    category: { en: "Design", fr: "Design" },
    posted: "2026-07-06",
    tags: ["Figma", "Research", "Prototyping", "Design systems"],
    summary: {
      en: "Design useful, low-friction digital journeys for young people accessing services from mobile devices.",
      fr: "Concevez des parcours numériques utiles et fluides pour des jeunes qui accèdent aux services depuis leur téléphone.",
    },
    responsibilities: {
      en: [
        "Turn interview notes into clear user journeys.",
        "Prototype responsive interfaces in Figma.",
        "Test concepts with participants in several Ivorian cities.",
      ],
      fr: [
        "Transformer les entretiens en parcours utilisateurs clairs.",
        "Prototyper des interfaces responsives dans Figma.",
        "Tester les concepts avec des participants de plusieurs villes ivoiriennes.",
      ],
    },
  },
  {
    slug: "charge-marketing-digital-marche-babi",
    href: "/jobs?q=marketing%20digital",
    illustrative: true,
    title: { en: "Digital Marketing Officer", fr: "Chargé de marketing digital" },
    company: "Marché Babi · entreprise fictive",
    location: { en: "Marcory, Abidjan", fr: "Marcory, Abidjan" },
    country: "Côte d’Ivoire",
    workplace: "hybrid",
    type: { en: "Full-time", fr: "Temps plein" },
    category: { en: "Marketing", fr: "Marketing" },
    posted: "2026-07-03",
    tags: ["Social media", "Content", "Analytics", "E-commerce"],
    summary: {
      en: "Create lively, useful campaigns for an Ivorian audience and learn from performance data every week.",
      fr: "Créez des campagnes vivantes et utiles pour un public ivoirien, puis apprenez chaque semaine grâce aux données de performance.",
    },
    responsibilities: {
      en: [
        "Prepare a weekly content calendar in French.",
        "Adapt visuals and copy for mobile-first channels.",
        "Track campaign performance and recommend improvements.",
      ],
      fr: [
        "Préparer un calendrier éditorial hebdomadaire en français.",
        "Adapter les visuels et les textes aux canaux mobiles.",
        "Suivre les performances des campagnes et proposer des améliorations.",
      ],
    },
  },
  {
    slug: "coordinateur-logistique-junior-cap-san-pedro",
    href: "/jobs?q=logistique",
    illustrative: true,
    title: { en: "Junior Logistics Coordinator", fr: "Coordinateur logistique junior" },
    company: "Cap San-Pédro Logistique · entreprise fictive",
    location: { en: "San-Pédro, Côte d’Ivoire", fr: "San-Pédro, Côte d’Ivoire" },
    country: "Côte d’Ivoire",
    workplace: "on-site",
    type: { en: "Graduate internship", fr: "Stage de pré-emploi" },
    category: { en: "Operations", fr: "Opérations" },
    posted: "2026-07-01",
    tags: ["Supply chain", "Port operations", "Excel", "Coordination"],
    summary: {
      en: "Learn to coordinate freight milestones with calm communication, reliable reporting, and close field follow-up.",
      fr: "Apprenez à coordonner les étapes du fret avec une communication sereine, un suivi fiable et une présence terrain.",
    },
    responsibilities: {
      en: [
        "Update shipment milestones and flag delays early.",
        "Prepare concise handover notes for operations teams.",
        "Help improve the daily tracking dashboard.",
      ],
      fr: [
        "Mettre à jour les étapes d’expédition et signaler rapidement les retards.",
        "Préparer des notes de transmission concises pour les équipes opérationnelles.",
        "Contribuer à l’amélioration du tableau de suivi quotidien.",
      ],
    },
  },
];

export const getOpportunity = (slug: string) => opportunities.find((opportunity) => opportunity.slug === slug);
