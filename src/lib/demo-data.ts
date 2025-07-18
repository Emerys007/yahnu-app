
export const staticCompanies = [
    {
        name: "MTN Côte d'Ivoire",
        tagline: "Connecting Côte d'Ivoire to the world.",
        industry: "Telecommunications",
        location: "Abidjan",
        featuredJobs: ["Network Engineer", "Marketing Manager", "Customer Service Agent"],
        slug: "mtn-ci"
    },
    {
        name: "Société Ivoirienne de Raffinage (SIR)",
        tagline: "Fueling the nation's progress.",
        industry: "Energy & Oil",
        location: "Abidjan",
        featuredJobs: ["Chemical Engineer", "Process Operator", "Safety Inspector"],
        slug: "sir"
    },
    {
        name: "Orange Côte d'Ivoire",
        tagline: "Life changes with Orange.",
        industry: "Telecommunications",
        location: "Abidjan",
        featuredJobs: ["Fiber Optic Technician", "Cloud Solutions Architect", "Digital Product Manager"],
        slug: "orange-ci"
    },
    {
        name: "Compagnie Ivoirienne d'Électricité (CIE)",
        tagline: "Lighting up the future of Côte d'Ivoire.",
        industry: "Utilities",
        location: "Abidjan",
        featuredJobs: ["Electrical Engineer", "Grid Operations Manager", "Data Analyst"],
        slug: "cie"
    },
];

export const staticSchools = [
    {
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        acronym: "INP-HB",
        location: "Yamoussoukro",
        description: "A leading polytechnic institution in West Africa, known for its rigorous engineering and technology programs.",
        slug: "inp-hb"
    },
    {
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        location: "Abidjan",
        description: "The largest university in Côte d'Ivoire, offering a wide range of programs in sciences, arts, and humanities.",
        slug: "ufhb"
    },
    {
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        location: "Abidjan",
        description: "A private university renowned for its focus on technology, engineering, and business management.",
        slug: "csi"
    },
    {
        name: "Université Nangui Abrogoua",
        acronym: "UNA",
        location: "Abidjan",
        description: "A public university focused on science and nature, contributing to environmental and biological research.",
        slug: "una"
    },
];

export const staticCompanyProfiles = [
    {
        slug: "mtn-ci",
        name: "MTN Côte d'Ivoire",
        tagline: "Connecting Côte d'Ivoire to the world.",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        industry: "Telecommunications",
        website: "https://www.mtn.ci",
        description: "<p>MTN Côte d'Ivoire is a leading telecommunications provider, offering mobile, data, and digital services to millions of Ivorians. As part of the MTN Group, we are committed to Africa's progress and are constantly innovating to brighten the lives of our customers.</p>",
        jobs: [
          { title: "Network Engineer", type: "Full-time", location: "Abidjan" },
          { title: "Marketing Manager", type: "Full-time", location: "Abidjan" },
          { title: "Cloud Solutions Architect", type: "Full-time", location: "Remote" },
        ],
    },
    {
        slug: "sir",
        name: "Société Ivoirienne de Raffinage (SIR)",
        tagline: "Fueling the nation's progress.",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        industry: "Energy & Oil",
        website: "https://www.sir.ci",
        description: "<p>The Société Ivoirienne de Raffinage is a key player in the West African energy sector. Our mission is to refine crude oil and ensure a stable supply of petroleum products for the country and the sub-region. We are looking for dedicated professionals to join our dynamic team.</p>",
        jobs: [
            { title: "Chemical Engineer", type: "Full-time", location: "Abidjan" },
            { title: "Process Operator", type: "Full-time", location: "Abidjan" },
            { title: "Safety Inspector", type: "Full-time", location: "Abidjan" },
        ],
    },
     {
        slug: "orange-ci",
        name: "Orange Côte d'Ivoire",
        tagline: "Life changes with Orange.",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        industry: "Telecommunications",
        website: "https://www.orange.ci",
        description: "<p>As a global leader in telecommunications, Orange Côte d'Ivoire provides a wide range of services including mobile, internet, and enterprise solutions. We are dedicated to digital inclusion and innovation.</p>",
        jobs: [
            { title: "Fiber Optic Technician", type: "Full-time", location: "Abidjan" },
            { title: "Digital Product Manager", type: "Full-time", location: "Abidjan" },
        ],
    },
    {
        slug: "cie",
        name: "Compagnie Ivoirienne d'Électricité (CIE)",
        tagline: "Lighting up the future of Côte d'Ivoire.",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        industry: "Utilities",
        website: "https://www.cie.ci",
        description: "<p>CIE is the main electricity provider in Côte d'Ivoire, responsible for the generation, transmission, and distribution of electrical power. We are committed to providing reliable and affordable energy to all.</p>",
        jobs: [
            { title: "Electrical Engineer", type: "Full-time", location: "Abidjan" },
            { title: "Grid Operations Manager", type: "Full-time", location: "Abidjan" },
        ],
    },
];

export const staticSchoolProfiles = [
    {
        slug: "inp-hb",
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        acronym: "INP-HB",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "<p>The INP-HB is a public polytechnic institution in Yamoussoukro, Côte d'Ivoire. It was founded in 1996 and is one of the most prestigious engineering schools in West Africa.</p><p>The institute offers a wide range of programs in engineering, technology, and applied sciences. It is known for its strong ties with industry and its commitment to research and innovation.</p>",
        programs: ["Computer Science & Engineering", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Agronomy"],
    },
    {
        slug: "ufhb",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        website: "https://www.univ-fhb.ci",
        description: "<p>The Université Félix Houphouët-Boigny is the largest and one of the oldest universities in Côte d'Ivoire. Located in the Cocody neighborhood of Abidjan, it offers a vast array of programs across numerous faculties, including science, law, medicine, and humanities.</p>",
        programs: ["Law", "Economics", "Medicine", "Pharmacy", "Arts and Human Sciences"],
    },
    {
        slug: "csi",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "<p>CSI Pôle Polytechnique is a private higher education group renowned for its focus on technology, engineering, and business management. It aims to train a new generation of African leaders and entrepreneurs.</p>",
        programs: ["Software Engineering", "Network & Telecommunications", "Business Administration", "Finance & Accounting"],
    },
    {
        slug: "una",
        name: "Université Nangui Abrogoua",
        acronym: "UNA",
        logoUrl: "/images/yahnu-logo.svg",
        location: "Abidjan",
        website: "https://www.una.ci",
        description: "<p>The Université Nangui Abrogoua is a public university in Abidjan, specializing in fundamental and applied sciences, with a strong emphasis on natural sciences and environmental studies. It plays a key role in scientific research in the region.</p>",
        programs: ["Mathematics and Computer Science", "Earth and Water Sciences", "Biological Sciences", "Food Science"],
    },
];
