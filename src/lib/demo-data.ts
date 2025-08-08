
import {
    User,
    Briefcase,
    GraduationCap,
    Users,
    Building,
    Calendar,
    Settings,
    LayoutGrid,
    BarChart,
    FileText,
    LifeBuoy,
    LogOut,
    Mail,
    MessageSquare,
    PlusCircle,
    UserPlus,
    Users2,
    Bell,
    CheckCircle2,
    Flag,
  } from 'lucide-react';
  
  export const teamMembers = [
    {
      name: 'Joël K',
      role: 'about.team.roles.founder_ceo',
      image: '/images/Joel K.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/joel-kotto',
        twitter: 'https://twitter.com/joel_kotto',
      },
    },
    {
      name: 'Béthel T',
      role: 'about.team.roles.head_of_product',
      image: '/images/Bethel_Touman.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/bethel-touman',
        twitter: '#',
      },
    },
    {
      name: 'Colombe K',
      role: 'about.team.roles.partnerships_manager',
      image: '/images/Colombe Koffi.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/colombekoffi',
        twitter: '#',
      },
    },
  ];
  
  export const allPosts = [
    {
      slug: 'future-of-work-remote',
      author: 'blog_author',
      date: '2024-07-22',
      image: '/images/Blog/remote-work.jpg',
      title: {
        en: 'The Future of Work in Africa is Remote',
        fr: "L'avenir du travail en Afrique est à distance",
      },
      brief: {
        en: "The global shift towards remote work presents a massive opportunity for Africa's talented youth. Discover the trends, benefits, and challenges.",
        fr: `Le passage mondial au travail à distance représente une opportunité massive pour la jeunesse talentueuse d'Afrique. Découvrez les tendances, les avantages et les défis.`,
      },
      content: {
        en: `
          <p class="lead mb-6">The global pandemic accelerated a trend that was already simmering: the rise of remote work. For Africa, this isn't just a passing phase; it's a paradigm shift that holds the potential to unlock unprecedented opportunities for its vibrant and youthful population.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">A World of Opportunity for Graduates</h3>
          <p class="mb-4">For the first time, a graduate in Lagos, Accra, or Nairobi can compete for a role in a company based in New York, London, or Tokyo without leaving their home city. This breaks down geographical barriers that have long limited career prospects. The benefits are immense:</p>
          <ul class="list-disc list-inside mb-4 space-y-2">
            <li><strong>Access to Global Job Markets:</strong> Talented individuals are no longer restricted to their local job market, dramatically expanding their career options.</li>
            <li><strong>Competitive Salaries:</strong> Working for international companies often means access to better pay, boosting local economies.</li>
            <li><strong>Work-Life Balance:</strong> Eliminating the daily commute and offering flexible hours can lead to a significant improvement in quality of life.</li>
          </ul>
          <h3 class="text-2xl font-bold mt-8 mb-4">A Strategic Advantage for Companies</h3>
          <p class="mb-4">The remote work revolution is a two-way street. Companies, both local and international, stand to gain significantly by embracing it:</p>
          <ul class="list-disc list-inside mb-4 space-y-2">
            <li><strong>Vast Talent Pool:</strong> Businesses can now recruit from across the entire continent, finding the perfect skills for their needs without geographic limitation.</li>
            <li><strong>Reduced Costs:</strong> Less need for large office spaces translates to lower overhead costs, a critical advantage for startups and scaling businesses.</li>
            <li><strong>Increased Diversity and Productivity:</strong> Diverse teams are more innovative. Furthermore, many studies show that remote workers are often more focused and productive.</li>
          </ul>
          <h3 class="text-2xl font-bold mt-8 mb-4">Navigating the Challenges</h3>
          <p class="mb-4">Of course, the transition is not without its hurdles. Challenges like reliable internet connectivity and consistent power supply are real concerns in many parts of the continent. However, these are rapidly improving. The rise of co-working spaces, solar power solutions, and expanding fiber optic networks are paving the way for a more connected future. Graduates, in turn, must cultivate self-discipline, proactivity, and excellent digital communication skills to thrive in a remote setting.</p>
          <p class="mt-6">The future of work in Africa is here, and it is flexible, distributed, and digital. At Yahnu, we are committed to equipping graduates with the skills and connections needed to succeed in this new era of opportunity.</p>
        `,
        fr: `
          <p class="lead mb-6">La pandémie mondiale a accéléré une tendance qui couvait déjà : l'essor du travail à distance. Pour l'Afrique, ce n'est pas seulement une phase passagère ; c'est un changement de paradigme qui pourrait débloquer des opportunités sans précédent pour sa population jeune et dynamique.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">Un monde d'opportunités pour les diplômés</h3>
          <p class="mb-4">Pour la première fois, un diplômé de Lagos, Accra ou Nairobi peut postuler à un poste dans une entreprise basée à New York, Londres ou Tokyo sans quitter sa ville natale. Cela brise les barrières géographiques qui ont longtemps limité les perspectives de carrière. Les avantages sont immenses :</p>
          <ul class="list-disc list-inside mb-4 space-y-2">
            <li><strong>Accès aux marchés du travail mondiaux :</strong> Les personnes talentueuses ne sont plus limitées à leur marché du travail local, ce qui élargit considérablement leurs options de carrière.</li>
            <li><strong>Salaires compétitifs :</strong> Travailler pour des entreprises internationales signifie souvent accéder à de meilleurs salaires, stimulant ainsi les économies locales.</li>
            <li><strong>Équilibre travail-vie personnelle :</strong> La suppression des trajets quotidiens et l'offre d'horaires flexibles peuvent entraîner une amélioration significative de la qualité de vie.</li>
          </ul>
          <h3 class="text-2xl font-bold mt-8 mb-4">Un avantage stratégique pour les entreprises</h3>
          <p class="mb-4">La révolution du travail à distance est à double sens. Les entreprises, locales et internationales, ont beaucoup à gagner à l'adopter :</p>
          <ul class="list-disc list-inside mb-4 space-y-2">
            <li><strong>Vaste bassin de talents :</strong> Les entreprises peuvent désormais recruter sur tout le continent, trouvant les compétences parfaites pour leurs besoins sans limitation géographique.</li>
            <li><strong>Coûts réduits :</strong> Moins de besoin de grands espaces de bureaux se traduit par des frais généraux moins élevés, un avantage essentiel pour les startups et les entreprises en croissance.</li>
            <li><strong>Diversité et productivité accrues :</strong> Les équipes diversifiées sont plus innovantes. De plus, de nombreuses études montrent que les travailleurs à distance sont souvent plus concentrés et productifs.</li>
          </ul>
          <h3 class="text-2xl font-bold mt-8 mb-4">Naviguer les défis</h3>
          <p class="mb-4">Bien sûr, la transition n'est pas sans obstacles. Des défis tels qu'une connectivité Internet fiable et une alimentation électrique constante sont de réelles préoccupations dans de nombreuses régions du continent. Cependant, ceux-ci s'améliorent rapidement. L'essor des espaces de coworking, des solutions d'énergie solaire et l'expansion des réseaux de fibre optique ouvrent la voie à un avenir plus connecté. Les diplômés, à leur tour, doivent cultiver l'autodiscipline, la proactivité et d'excellentes compétences en communication numérique pour s'épanouir dans un environnement distant.</p>
          <p class="mt-6">L'avenir du travail en Afrique est là, et il est flexible, distribué et numérique. Chez Yahnu, nous nous engageons à doter les diplômés des compétences et des relations nécessaires pour réussir dans cette nouvelle ère d'opportunités.</p>
        `,
      },
    },
    {
      slug: 'bridging-the-gap',
      author: 'blog_author',
      date: '2024-07-20',
      image: '/images/Blog/Yahnu-Connects-Graduates-with-Industry.jpg',
      title: {
        en: 'Bridging the Gap: How Yahnu Connects Graduates with Industry',
        fr: "Combler le fossé : Comment Yahnu connecte les diplômés à l'industrie",
      },
      brief: {
        en: 'The "skills gap" is a major hurdle for graduates. Learn how Yahnu is building the bridge between education and the professional world.',
        fr: `Le "déficit de compétences" est un obstacle majeur pour les diplômés. Découvrez comment Yahnu construit le pont entre l'éducation et le monde professionnel.`,
      },
      content: {
        en: `
          <p class="lead mb-6">In discussions about employment in Africa, one term comes up repeatedly: the "skills gap." It refers to the disconnect between the knowledge acquired in educational institutions and the practical, evolving skills demanded by the modern industry. This gap is a significant barrier, leaving talented graduates underemployed and companies struggling to find job-ready candidates. Yahnu was founded to be the bridge across this divide.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">The Core of the Problem</h3>
          <p class="mb-4">Universities provide essential theoretical foundations, but often curricula can't keep pace with the rapid technological and methodological shifts in the workplace. Graduates may leave with a degree but without hands-on experience in the latest software, an understanding of current industry workflows, or the specific "soft skills" that are critical for collaboration and innovation. The result is a frustrating cycle of rejection for graduates and a costly, time-consuming recruitment process for employers.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">Yahnu's Three-Pillar Solution</h3>
          <p class="mb-4">We tackle this problem by creating a symbiotic ecosystem that benefits all stakeholders: graduates, companies, and schools.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">1. Empowering Graduates</h4>
          <p class="mb-4">We provide graduates with the tools to showcase their true potential. A Yahnu profile is more than a CV; it's a dynamic portfolio. Through our platform, graduates can take industry-relevant skills assessments, earn certifications, and clearly demonstrate their capabilities to potential employers. This moves the focus from just having a degree to proving applicable skills.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">2. Equipping Companies</h4>
          <p class="mb-4">For companies, Yahnu is a talent pipeline of vetted candidates. Instead of sifting through hundreds of generic applications, recruiters can filter for specific, verified skills. Our platform provides rich data points on each candidate, drastically reducing the time and uncertainty of the hiring process. It's about finding not just a candidate, but the right candidate, efficiently.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">3. Engaging Schools</h4>
          <p class="mb-4">We close the loop by providing universities with valuable, data-driven insights. By seeing which skills are most in-demand by employers, schools can better tailor their curricula and career services. Yahnu facilitates meaningful partnerships between academia and industry, ensuring that education is truly aligned with the needs of the economy.</p>
          <p class="mt-6">By creating these connections, Yahnu is not just filling jobs. We are building futures, fostering a more agile and prepared workforce, and ensuring that the immense talent of Africa's youth is not just recognized, but fully realized.</p>
        `,
        fr: `
          <p class="lead mb-6">Dans les discussions sur l'emploi en Afrique, un terme revient sans cesse : le "déficit de compétences". Il désigne le décalage entre les connaissances acquises dans les établissements d'enseignement et les compétences pratiques et évolutives exigées par l'industrie moderne. Ce fossé est un obstacle important, qui laisse des diplômés talentueux sous-employés et des entreprises qui peinent à trouver des candidats prêts à l'emploi. Yahnu a été fondée pour jeter un pont sur ce fossé.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">Le cœur du problème</h3>
          <p class="mb-4">Les universités fournissent des bases théoriques essentielles, mais les programmes d'études ne peuvent souvent pas suivre le rythme des changements technologiques et méthodologiques rapides du lieu de travail. Les diplômés peuvent obtenir un diplôme mais sans expérience pratique des derniers logiciels, sans compréhension des flux de travail actuels de l'industrie ou sans les "compétences non techniques" spécifiques qui sont essentielles à la collaboration et à l'innovation. Le résultat est un cycle frustrant de rejet pour les diplômés et un processus de recrutement coûteux et long pour les employeurs.</p>
          <h3 class="text-2xl font-bold mt-8 mb-4">La solution à trois piliers de Yahnu</h3>
          <p class="mb-4">Nous nous attaquons à ce problème en créant un écosystème symbiotique qui profite à toutes les parties prenantes : les diplômés, les entreprises et les écoles.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">1. Autonomiser les diplômés</h4>
          <p class="mb-4">Nous fournissons aux diplômés les outils nécessaires pour mettre en valeur leur véritable potentiel. Un profil Yahnu est plus qu'un CV ; c'est un portfolio dynamique. Grâce à notre plateforme, les diplômés peuvent passer des évaluations de compétences pertinentes pour l'industrie, obtenir des certifications et démontrer clairement leurs capacités aux employeurs potentiels. L'accent n'est plus mis sur le simple fait d'avoir un diplôme, mais sur la preuve de compétences applicables.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">2. Équiper les entreprises</h4>
          <p class="mb-4">Pour les entreprises, Yahnu est un vivier de talents de candidats sélectionnés. Au lieu de passer au crible des centaines de candidatures génériques, les recruteurs peuvent filtrer les compétences spécifiques et vérifiées. Notre plateforme fournit des points de données riches sur chaque candidat, ce qui réduit considérablement le temps et l'incertitude du processus d'embauche. Il s'agit de trouver non seulement un candidat, mais le bon candidat, de manière efficace.</p>
          <h4 class="text-xl font-semibold mt-6 mb-2">3. Engager les écoles</h4>
          <p class="mb-4">Nous bouclons la boucle en fournissant aux universités des informations précieuses basées sur des données. En voyant quelles compétences sont les plus demandées par les employeurs, les écoles peuvent mieux adapter leurs programmes d'études et leurs services d'orientation professionnelle. Yahnu facilite les partenariats significatifs entre le monde universitaire et l'industrie, en veillant à ce que l'éducation soit véritablement alignée sur les besoins de l'économie.</p>
          <p class="mt-6">En créant ces liens, Yahnu ne se contente pas de pourvoir des postes. Nous construisons des avenirs, nous favorisons une main-d'œuvre plus agile et mieux préparée, et nous veillons à ce que l'immense talent de la jeunesse africaine ne soit pas seulement reconnu, mais pleinement réalisé.</p>
        `,
      },
    },
    // Add other blog posts here...
  ];
  
  export const dashboardNavItems = {
    graduate: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'My Profile', href: '/dashboard/profile', icon: User },
      { label: 'Job Applications', href: '/dashboard/applications', icon: Briefcase },
      { label: 'Assessments', href: '/dashboard/assessments', icon: CheckCircle2 },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Events', href: '/dashboard/events', icon: Calendar },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    company: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'Company Profile', href: '/dashboard/company-profile', icon: Building },
      { label: 'Job Postings', href: '/dashboard/job-postings', icon: PlusCircle },
      { label: 'Applicants', href: '/dashboard/applicants', icon: Users },
      { label: 'Talent Pool', href: '/dashboard/talent-pool', icon: Users2 },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    school: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'School Profile', href: '/dashboard/school-profile', icon: GraduationCap },
      { label: 'Graduate Management', href: '/dashboard/graduate-management', icon: Users },
      { label: 'Partnerships', href: '/dashboard/partnerships', icon: Users2 },
      { label: 'Analytics', href: '/dashboard/reports', icon: BarChart },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    admin: [
      { label: 'Overview', href: '/dashboard/admin/overview', icon: LayoutGrid },
      { label: 'User Management', href: '/dashboard/admin/user-management', icon: Users },
      { label: 'Content Moderation', href: '/dashboard/admin/content-moderation', icon: Flag },
      { label: 'Announcements', href: '/dashboard/admin/announcements', icon: Bell },
      { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart },
      { label: 'System Health', href: '/dashboard/admin/system-health', icon: CheckCircle2 },
      { label: 'Team', href: '/dashboard/admin/team', icon: Users2 },
    ],
  };
