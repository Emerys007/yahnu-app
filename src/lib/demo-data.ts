import {
  BarChart,
  Bell,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Flag,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  PlusCircle,
  Settings,
  User,
  Users,
  Users2,
} from "lucide-react";

export const teamMembers = [
  {
    name: "Joël K",
    role: "about.team.roles.founder_ceo",
    image: "/images/Joel K.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/joel-kotto",
      twitter: "https://twitter.com/joel_kotto",
    },
  },
  {
    name: "Béthel T",
    role: "about.team.roles.head_of_product",
    image: "/images/Bethel_Touman.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/bethel-touman",
    },
  },
  {
    name: "Colombe K",
    role: "about.team.roles.partnerships_manager",
    image: "/images/Colombe Koffi.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/colombekoffi",
    },
  },
];

export const allPosts = [
  {
    slug: "travailler-distance-cote-ivoire",
    author: "blog_author",
    date: "2026-06-18",
    image: "/images/Blog/remote-work.jpg",
    title: {
      fr: "Télétravail en Côte d’Ivoire : bien démarrer après l’université",
      en: "Remote work in Côte d’Ivoire: a graduate’s practical start",
    },
    brief: {
      fr: "Connexion, rythme, communication : des repères concrets pour travailler à distance depuis Abidjan, Bouaké, Korhogo ou San-Pédro.",
      en: "Connectivity, routines, and communication: practical guidance for remote work from Abidjan, Bouaké, Korhogo, or San-Pédro.",
    },
    content: {
      fr: `
        <p class="lead mb-6">Le travail à distance ouvre de nouvelles possibilités aux jeunes diplômés ivoiriens, sans faire disparaître les réalités du quotidien. Une bonne expérience repose moins sur l’équipement parfait que sur une organisation fiable, des attentes claires et une communication régulière.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Préparer un cadre de travail réaliste</h3>
        <p class="mb-4">À Abidjan comme à Bouaké, Korhogo ou San-Pédro, commencez par identifier les moments où votre connexion est la plus stable et un lieu où vous pouvez vous concentrer. Un espace de coworking, une bibliothèque ou une pièce calme à domicile peuvent tous convenir selon votre situation.</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Prévoir un plan B :</strong> gardez un forfait mobile de secours et synchronisez les documents utiles avant une réunion importante.</li>
          <li><strong>Protéger son rythme :</strong> fixez une heure de début, de pause et de fin pour éviter que la journée ne déborde.</li>
          <li><strong>Rendre son travail visible :</strong> partagez chaque semaine ce qui est terminé, ce qui avance et ce qui bloque.</li>
        </ul>
        <h3 class="text-2xl font-bold mt-8 mb-4">Communiquer avec clarté</h3>
        <p class="mb-4">À distance, vos collègues ne voient pas toujours vos efforts. Un message court et précis vaut mieux qu’un long silence : indiquez le contexte, l’action attendue et le délai. Si une consigne reste floue, reformulez-la avant de commencer.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Présenter des preuves, pas seulement des promesses</h3>
        <p class="mb-4">Un mini-portfolio peut montrer un tableau de bord, une maquette mobile, un plan de campagne ou une note d’analyse. Expliquez le problème, votre contribution et le résultat. Les projets universitaires et associatifs comptent lorsqu’ils sont racontés avec précision.</p>
        <p class="mt-6">Votre premier poste à distance se construit par petites habitudes : être joignable, tenir ses engagements, demander de l’aide tôt et apprendre à documenter son travail. Yahnu vous aide à transformer ces habitudes en signaux professionnels visibles.</p>
      `,
      en: `
        <p class="lead mb-6">Remote work creates new options for Ivorian graduates without removing everyday constraints. A good experience depends less on perfect equipment than on reliable routines, clear expectations, and steady communication.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Set up a realistic work environment</h3>
        <p class="mb-4">Whether you are in Abidjan, Bouaké, Korhogo, or San-Pédro, start by identifying when your connection is most stable and where you can focus. A coworking space, library, or quiet room at home can all work depending on your situation.</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Keep a backup:</strong> maintain a mobile-data option and sync important documents before a key meeting.</li>
          <li><strong>Protect your routine:</strong> define a start time, breaks, and a finish time so work does not take over the day.</li>
          <li><strong>Make progress visible:</strong> share what is done, moving, and blocked each week.</li>
        </ul>
        <h3 class="text-2xl font-bold mt-8 mb-4">Communicate clearly</h3>
        <p class="mb-4">Remote colleagues cannot always see your effort. A short, precise message is better than a long silence: state the context, expected action, and deadline. If an instruction remains unclear, restate it before starting.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Show evidence, not only promises</h3>
        <p class="mb-4">A compact portfolio can feature a dashboard, mobile prototype, campaign plan, or analysis note. Explain the problem, your contribution, and the outcome. University and student-association projects count when you describe them precisely.</p>
        <p class="mt-6">Your first remote role is built through small habits: stay reachable, honour commitments, ask for help early, and document your work. Yahnu helps you turn those habits into visible professional signals.</p>
      `,
    },
  },
  {
    slug: "premier-emploi-competences-cote-ivoire",
    author: "blog_author",
    date: "2026-06-11",
    image: "/images/Blog/Yahnu-Connects-Graduates-with-Industry.jpg",
    title: {
      fr: "Du diplôme au premier emploi : rendre ses compétences visibles en Côte d’Ivoire",
      en: "From degree to first job: showing your skills in Côte d’Ivoire",
    },
    brief: {
      fr: "Un guide simple pour relier projets universitaires, stages et activités associatives aux besoins des employeurs ivoiriens.",
      en: "A practical guide to connecting university projects, internships, and student activities with the needs of Ivorian employers.",
    },
    content: {
      fr: `
        <p class="lead mb-6">Le passage du campus au premier emploi peut sembler difficile : les entreprises demandent de l’expérience alors qu’un jeune diplômé commence justement à la construire. La solution consiste à rendre visibles les compétences déjà pratiquées, même dans un projet universitaire, un stage court ou une association étudiante.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Lire le marché ivoirien par problèmes à résoudre</h3>
        <p class="mb-4">Les secteurs numériques, agricoles, logistiques, énergétiques, financiers et créatifs ont des besoins différents, mais recherchent souvent les mêmes bases : apprendre vite, communiquer clairement, analyser une situation et livrer un travail fiable. Identifiez d’abord le problème auquel vous voulez contribuer.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Transformer un projet en preuve</h3>
        <p class="mb-4">Ne vous contentez pas d’écrire « maîtrise d’Excel » ou « esprit d’équipe ». Montrez une situation réelle : un budget d’association structuré, un tableau de suivi créé pendant un stage ou une enquête menée auprès d’étudiants.</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Contexte :</strong> quel était le besoin et pour qui ?</li>
          <li><strong>Action :</strong> qu’avez-vous réalisé personnellement ?</li>
          <li><strong>Résultat :</strong> qu’est-ce qui a été simplifié, appris ou amélioré ?</li>
        </ul>
        <h3 class="text-2xl font-bold mt-8 mb-4">Adapter son profil à une opportunité précise</h3>
        <p class="mb-4">Une candidature pour un poste data au Plateau ne raconte pas la même histoire qu’une mission terrain dans le Bélier ou un rôle logistique à San-Pédro. Gardez une base commune, puis mettez en avant les deux ou trois preuves les plus proches du besoin.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Construire son réseau avec naturel</h3>
        <p class="mb-4">Demandez un conseil précis à un ancien étudiant, un encadreur de stage ou un professionnel rencontré lors d’un événement. Un message respectueux, personnalisé et facile à traiter ouvre plus de portes qu’une demande vague d’emploi.</p>
        <p class="mt-6">Yahnu rapproche profils, établissements et entreprises afin que le potentiel des jeunes diplômés ivoiriens soit plus facile à comprendre et à activer.</p>
      `,
      en: `
        <p class="lead mb-6">Moving from campus to a first job can feel difficult: employers ask for experience just as a graduate is beginning to build it. The practical answer is to make existing skills visible, even when they come from a university project, short internship, or student association.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Read the Ivorian market through problems</h3>
        <p class="mb-4">Digital, agriculture, logistics, energy, finance, and creative industries have different needs, but often value the same foundations: learning quickly, communicating clearly, analysing a situation, and delivering reliable work. Start by identifying the problem you want to help solve.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Turn a project into evidence</h3>
        <p class="mb-4">Do not stop at writing “Excel skills” or “team player.” Show a real situation: a structured student-association budget, an internship tracking sheet, or a survey conducted with students.</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Context:</strong> what was needed, and by whom?</li>
          <li><strong>Action:</strong> what did you personally create or change?</li>
          <li><strong>Outcome:</strong> what became simpler, clearer, or better?</li>
        </ul>
        <h3 class="text-2xl font-bold mt-8 mb-4">Adapt your profile to a specific opportunity</h3>
        <p class="mb-4">A data role in Plateau needs a different story from a field assignment in Bélier or a logistics role in San-Pédro. Keep a consistent foundation, then highlight the two or three examples closest to the employer’s need.</p>
        <h3 class="text-2xl font-bold mt-8 mb-4">Build your network naturally</h3>
        <p class="mb-4">Ask a precise question of an alumnus, internship supervisor, or professional you met at an event. A respectful, personal message that is easy to answer opens more doors than a vague request for a job.</p>
        <p class="mt-6">Yahnu connects profiles, institutions, and employers so the potential of young Ivorian graduates is easier to understand and activate.</p>
      `,
    },
  },
];

export const dashboardNavItems = {
  graduate: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutGrid },
    { label: "Mon profil", href: "/dashboard/profile", icon: User },
    { label: "Mes candidatures", href: "/dashboard/applications", icon: Briefcase },
    { label: "Évaluations", href: "/dashboard/assessments", icon: CheckCircle2 },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Événements", href: "/dashboard/events", icon: Calendar },
    { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
    { label: "Aide", href: "/dashboard/support", icon: LifeBuoy },
  ],
  company: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutGrid },
    { label: "Profil entreprise", href: "/dashboard/company-profile", icon: Building },
    { label: "Offres publiées", href: "/dashboard/job-postings", icon: PlusCircle },
    { label: "Candidatures", href: "/dashboard/applicants", icon: Users },
    { label: "Vivier de talents", href: "/dashboard/talent-pool", icon: Users2 },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
    { label: "Aide", href: "/dashboard/support", icon: LifeBuoy },
  ],
  school: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutGrid },
    { label: "Profil établissement", href: "/dashboard/school-profile", icon: GraduationCap },
    { label: "Suivi des diplômés", href: "/dashboard/graduate-management", icon: Users },
    { label: "Partenariats", href: "/dashboard/partnerships", icon: Users2 },
    { label: "Analyses", href: "/dashboard/reports", icon: BarChart },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
    { label: "Aide", href: "/dashboard/support", icon: LifeBuoy },
  ],
  admin: [
    { label: "Vue d’ensemble", href: "/dashboard/admin/overview", icon: LayoutGrid },
    { label: "Utilisateurs", href: "/dashboard/admin/user-management", icon: Users },
    { label: "Modération", href: "/dashboard/admin/content-moderation", icon: Flag },
    { label: "Annonces", href: "/dashboard/admin/announcements", icon: Bell },
    { label: "Analyses", href: "/dashboard/admin/analytics", icon: BarChart },
    { label: "État du service", href: "/dashboard/admin/system-health", icon: CheckCircle2 },
    { label: "Équipe Yahnu", href: "/dashboard/admin/team", icon: Users2 },
  ],
};
