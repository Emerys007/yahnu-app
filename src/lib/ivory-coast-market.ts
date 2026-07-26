export type IvorianInstitutionReference = {
  slug: string;
  name: string;
  city: string;
  type: "public" | "private-nonprofit";
  focus: {
    fr: string;
    en: string;
  };
  officialUrl: string;
};

export type VerifiedMarketOpportunity = {
  slug: string;
  company: string;
  title: {
    fr: string;
    en: string;
  };
  location: {
    fr: string;
    en: string;
  };
  workMode: "on-site" | "hybrid" | "remote-flexible";
  contract: {
    fr: string;
    en: string;
  };
  summary: {
    fr: string;
    en: string;
  };
  tags: string[];
  publishedAt?: string;
  deadlineAt?: string;
  verifiedAt: string;
  expiresAt: string;
  sourceUrl: string;
};

export type PublicMarketOpportunity = Omit<VerifiedMarketOpportunity, "sourceUrl">;

// Editorial references only. Inclusion does not imply ranking, endorsement, or
// a commercial relationship with Yahnu. The links point to official websites.
export const ivorianInstitutionReferences: readonly IvorianInstitutionReference[] = [
  {
    slug: "universite-felix-houphouet-boigny",
    name: "Université Félix Houphouët-Boigny",
    city: "Cocody, Abidjan",
    type: "public",
    focus: {
      fr: "Grande université publique pluridisciplinaire.",
      en: "Large multidisciplinary public university.",
    },
    officialUrl: "https://w.univ-fhb.edu.ci/",
  },
  {
    slug: "inp-hb",
    name: "Institut National Polytechnique Félix Houphouët-Boigny",
    city: "Yamoussoukro",
    type: "public",
    focus: {
      fr: "Ingénierie, industrie, agronomie et management.",
      en: "Engineering, industry, agronomy and management.",
    },
    officialUrl: "https://inphb.edu.ci/",
  },
  {
    slug: "universite-nangui-abrogoua",
    name: "Université Nangui Abrogoua",
    city: "Abobo-Adjamé, Abidjan",
    type: "public",
    focus: {
      fr: "Sciences, environnement et technologies alimentaires.",
      en: "Science, environment and food technologies.",
    },
    officialUrl: "https://www.univ-na.ci/",
  },
  {
    slug: "universite-alassane-ouattara",
    name: "Université Alassane Ouattara",
    city: "Bouaké",
    type: "public",
    focus: {
      fr: "Droit, économie, médecine, lettres et sciences sociales.",
      en: "Law, economics, medicine, humanities and social sciences.",
    },
    officialUrl: "https://univ-ao.edu.ci/",
  },
  {
    slug: "universite-jean-lorougnon-guede",
    name: "Université Jean Lorougnon Guédé",
    city: "Daloa",
    type: "public",
    focus: {
      fr: "Sciences, agroforesterie, environnement et développement durable.",
      en: "Science, agroforestry, environment and sustainable development.",
    },
    officialUrl: "https://ujlog.edu.ci/",
  },
  {
    slug: "universite-peleforo-gon-coulibaly",
    name: "Université Peleforo Gon Coulibaly",
    city: "Korhogo",
    type: "public",
    focus: {
      fr: "Biologie, agropastoral, médecine, lettres et sciences sociales.",
      en: "Biology, agropastoral studies, medicine, humanities and social sciences.",
    },
    officialUrl: "https://univ-pgc.edu.ci/",
  },
  {
    slug: "universite-polytechnique-de-man",
    name: "Université Polytechnique de Man",
    city: "Man",
    type: "public",
    focus: {
      fr: "Mines, énergie, matériaux et maintenance industrielle.",
      en: "Mining, energy, materials and industrial maintenance.",
    },
    officialUrl: "https://www.univ-man.edu.ci/",
  },
  {
    slug: "universite-polytechnique-de-san-pedro",
    name: "Université Polytechnique de San Pedro",
    city: "San-Pédro",
    type: "public",
    focus: {
      fr: "Sciences de la mer, logistique, tourisme, génie civil et agro-industrie.",
      en: "Marine science, logistics, tourism, civil engineering and agro-industry.",
    },
    officialUrl: "https://usp.edu.ci/",
  },
  {
    slug: "universite-virtuelle-de-cote-divoire",
    name: "Université Virtuelle de Côte d’Ivoire",
    city: "À distance · Abidjan",
    type: "public",
    focus: {
      fr: "Formation numérique et enseignement supérieur à distance.",
      en: "Digital learning and distance higher education.",
    },
    officialUrl: "https://www.uvci.edu.ci/",
  },
  {
    slug: "esatic",
    name: "ESATIC",
    city: "Treichville, Abidjan",
    type: "public",
    focus: {
      fr: "Télécommunications, réseaux, cybersécurité et régulation numérique.",
      en: "Telecommunications, networks, cybersecurity and digital regulation.",
    },
    officialUrl: "https://esatic.ci/",
  },
  {
    slug: "iugb",
    name: "International University of Grand-Bassam",
    city: "Grand-Bassam",
    type: "private-nonprofit",
    focus: {
      fr: "Enseignement anglophone de modèle américain, business et STEM.",
      en: "American-style English-language education, business and STEM.",
    },
    officialUrl: "https://iugb.edu.ci/",
  },
] as const;
