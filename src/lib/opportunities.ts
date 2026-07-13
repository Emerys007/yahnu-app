export type Opportunity = {
  slug: string;
  title: { en: string; fr: string };
  company: string;
  location: { en: string; fr: string };
  country: string;
  workplace: 'remote' | 'hybrid' | 'on-site';
  type: { en: string; fr: string };
  category: { en: string; fr: string };
  posted: string;
  featured?: boolean;
  tags: string[];
  summary: { en: string; fr: string };
  responsibilities: { en: string[]; fr: string[] };
};

export const opportunities: Opportunity[] = [
  {
    slug: 'tech-lead-orange',
    title: { en: 'Tech Lead, Mobile Money', fr: 'Responsable technique, Mobile Money' },
    company: 'Orange Côte d’Ivoire',
    location: { en: 'Abidjan, Côte d’Ivoire', fr: 'Abidjan, Côte d’Ivoire' },
    country: 'Côte d’Ivoire',
    workplace: 'hybrid',
    type: { en: 'Full-time', fr: 'Temps plein' },
    category: { en: 'Technology', fr: 'Technologie' },
    posted: '2026-07-08',
    featured: true,
    tags: ['Fintech', 'Leadership', 'APIs', 'Mobile'],
    summary: {
      en: 'Lead a product-minded engineering team building trusted payments experiences for millions of customers.',
      fr: 'Pilotez une équipe d’ingénierie orientée produit qui construit des expériences de paiement fiables pour des millions de clients.',
    },
    responsibilities: {
      en: ['Set technical direction for high-impact payment products.', 'Coach engineers and strengthen delivery practices.', 'Partner with product and risk teams to ship secure features.'],
      fr: ['Définir la direction technique des produits de paiement à fort impact.', 'Accompagner les ingénieurs et renforcer les pratiques de livraison.', 'Collaborer avec les équipes produit et risque pour livrer des fonctionnalités sûres.'],
    },
  },
  {
    slug: 'data-analyst-bridge-bank',
    title: { en: 'Data Analyst', fr: 'Analyste de données' },
    company: 'Bridge Bank Group',
    location: { en: 'Abidjan, Côte d’Ivoire', fr: 'Abidjan, Côte d’Ivoire' },
    country: 'Côte d’Ivoire',
    workplace: 'on-site',
    type: { en: 'Full-time', fr: 'Temps plein' },
    category: { en: 'Data & Analytics', fr: 'Données et analytique' },
    posted: '2026-07-05',
    featured: true,
    tags: ['SQL', 'Power BI', 'Finance', 'Insights'],
    summary: {
      en: 'Turn banking data into clear, decision-ready insights for teams across the organization.',
      fr: 'Transformez les données bancaires en informations claires et directement exploitables dans toute l’organisation.',
    },
    responsibilities: {
      en: ['Build concise dashboards for business leaders.', 'Model recurring performance and customer metrics.', 'Translate analysis into practical recommendations.'],
      fr: ['Créer des tableaux de bord concis pour les responsables métier.', 'Modéliser les performances récurrentes et les indicateurs clients.', 'Transformer les analyses en recommandations concrètes.'],
    },
  },
  {
    slug: 'agronomist-sifca',
    title: { en: 'Agronomist', fr: 'Ingénieur agronome' },
    company: 'SIFCA',
    location: { en: 'Yamoussoukro, Côte d’Ivoire', fr: 'Yamoussoukro, Côte d’Ivoire' },
    country: 'Côte d’Ivoire',
    workplace: 'on-site',
    type: { en: 'Full-time', fr: 'Temps plein' },
    category: { en: 'Agriculture', fr: 'Agriculture' },
    posted: '2026-07-01',
    tags: ['Agronomy', 'Field operations', 'Sustainability'],
    summary: {
      en: 'Support more productive, sustainable crop operations with field teams and regional partners.',
      fr: 'Soutenez des opérations agricoles plus productives et durables avec les équipes terrain et les partenaires régionaux.',
    },
    responsibilities: {
      en: ['Visit sites and collect actionable field observations.', 'Support sustainable crop-management programmes.', 'Share practical guidance with growers and operations teams.'],
      fr: ['Visiter les sites et recueillir des observations exploitables.', 'Soutenir des programmes de gestion durable des cultures.', 'Partager des conseils pratiques avec les producteurs et les équipes opérationnelles.'],
    },
  },
  {
    slug: 'ux-designer-jambaars',
    title: { en: 'Product Designer', fr: 'Designer produit' },
    company: 'Jambaars',
    location: { en: 'Remote · West Africa', fr: 'À distance · Afrique de l’Ouest' },
    country: 'Regional',
    workplace: 'remote',
    type: { en: 'Contract', fr: 'Contrat' },
    category: { en: 'Design', fr: 'Design' },
    posted: '2026-06-29',
    featured: true,
    tags: ['Figma', 'Research', 'SaaS', 'Design systems'],
    summary: {
      en: 'Shape a simple, thoughtful SaaS experience for teams working across Africa.',
      fr: 'Concevez une expérience SaaS simple et soignée pour des équipes travaillant à travers l’Afrique.',
    },
    responsibilities: {
      en: ['Lead discovery and turn insights into polished flows.', 'Create scalable interface patterns in Figma.', 'Partner closely with engineering from concept to release.'],
      fr: ['Mener la découverte et transformer les enseignements en parcours soignés.', 'Créer des modèles d’interface évolutifs dans Figma.', 'Collaborer étroitement avec l’ingénierie du concept à la mise en production.'],
    },
  },
  {
    slug: 'marketing-manager-solibra',
    title: { en: 'Marketing Manager', fr: 'Responsable marketing' },
    company: 'SOLIBRA',
    location: { en: 'Abidjan, Côte d’Ivoire', fr: 'Abidjan, Côte d’Ivoire' },
    country: 'Côte d’Ivoire',
    workplace: 'hybrid',
    type: { en: 'Full-time', fr: 'Temps plein' },
    category: { en: 'Marketing', fr: 'Marketing' },
    posted: '2026-06-26',
    tags: ['Brand', 'FMCG', 'Campaigns', 'Growth'],
    summary: {
      en: 'Bring distinctive brand campaigns to life across one of the region’s most dynamic consumer markets.',
      fr: 'Donnez vie à des campagnes de marque distinctives sur l’un des marchés de consommation les plus dynamiques de la région.',
    },
    responsibilities: {
      en: ['Plan integrated campaigns with commercial teams.', 'Measure performance and improve channel decisions.', 'Build strong relationships with creative partners.'],
      fr: ['Planifier des campagnes intégrées avec les équipes commerciales.', 'Mesurer les performances et améliorer les décisions de canal.', 'Développer des relations solides avec les partenaires créatifs.'],
    },
  },
  {
    slug: 'logistics-coordinator-ceva',
    title: { en: 'Logistics Coordinator', fr: 'Coordinateur logistique' },
    company: 'CEVA Logistics',
    location: { en: 'San-Pédro, Côte d’Ivoire', fr: 'San-Pédro, Côte d’Ivoire' },
    country: 'Côte d’Ivoire',
    workplace: 'on-site',
    type: { en: 'Full-time', fr: 'Temps plein' },
    category: { en: 'Operations', fr: 'Opérations' },
    posted: '2026-06-23',
    tags: ['Supply chain', 'Port operations', 'Coordination'],
    summary: {
      en: 'Keep complex freight operations moving with precision, calm coordination, and excellent communication.',
      fr: 'Faites avancer des opérations de fret complexes avec précision, coordination sereine et excellente communication.',
    },
    responsibilities: {
      en: ['Coordinate milestones across carriers and customers.', 'Surface risks early and protect service quality.', 'Improve operational reporting and handoffs.'],
      fr: ['Coordonner les jalons entre transporteurs et clients.', 'Identifier les risques tôt et protéger la qualité de service.', 'Améliorer les rapports opérationnels et les transmissions.'],
    },
  },
];

export const getOpportunity = (slug: string) => opportunities.find((opportunity) => opportunity.slug === slug);
