export type RecommendationProfile = {
  skills?: string[] | string | null;
  experience?: string | null;
  education?: Array<{ degree?: string; field?: string }> | null;
};

export type RecommendationJob = {
  kind: 'yahnu' | 'external';
  title: string;
  description: string;
  location?: string | null;
  categories?: string[] | null;
};

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, ' ')
    .trim();
}

function profileTerms(profile: RecommendationProfile) {
  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === 'string'
      ? profile.skills.split(/[,;\n]/)
      : [];
  const education = (profile.education ?? []).flatMap((entry) => [entry.degree ?? '', entry.field ?? '']);
  return Array.from(new Set([...skills, ...education]
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && term.length <= 80)));
}

export function recommendationReasons(profile: RecommendationProfile, job: RecommendationJob) {
  const haystack = normalize([
    job.title,
    job.description.slice(0, 6_000),
    job.location ?? '',
    ...(job.categories ?? []),
  ].join(' '));
  const matching = profileTerms(profile)
    .filter((term) => haystack.includes(normalize(term)))
    .slice(0, 3);
  const reasons: string[] = [];

  if (matching.length) reasons.push(`Correspond à vos compétences : ${matching.join(', ')}`);

  const location = normalize(job.location ?? '');
  if (/abidjan|cote d ivoire|ivory coast|yamoussoukro|bouake|san pedro/.test(location)) {
    reasons.push('Opportunité située en Côte d’Ivoire');
  } else if (/remote|a distance|teletravail/.test(location)) {
    reasons.push('Accessible à distance depuis la Côte d’Ivoire');
  }

  if (!reasons.length) {
    reasons.push(
      job.kind === 'yahnu'
        ? 'Publiée directement par une entreprise sur Yahnu'
        : 'Issue d’une page carrière officielle ouverte aux talents en Afrique',
    );
  }

  return reasons.slice(0, 2);
}

export function recommendationScore(profile: RecommendationProfile, job: RecommendationJob) {
  const reasons = recommendationReasons(profile, job);
  const skillsWeight = reasons[0]?.startsWith('Correspond') ? 20 : 0;
  const ivoryCoastWeight = reasons.some((reason) => reason.includes('Côte d’Ivoire')) ? 8 : 0;
  const directWeight = job.kind === 'yahnu' ? 3 : 0;
  return skillsWeight + ivoryCoastWeight + directWeight;
}
