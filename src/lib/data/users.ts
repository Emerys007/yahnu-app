import { type UserProfile } from "@/context/auth-context";

// Note: In a real database, UIDs would be unique Firebase Auth IDs.
// These are placeholders for seeding purposes.

export const seedUsers: Omit<UserProfile, 'uid'>[] = [
    // --- Graduates ---
    {
        email: "amina.diallo@example.com",
        name: "Amina Diallo",
        firstName: "Amina",
        lastName: "Diallo",
        role: "graduate",
        status: "active",
        schoolId: "school_inp_hb",
        phone: "+225 0102030405",
        experience: "2 years as a Frontend Developer at Tech Solutions Abidjan. Developed and maintained responsive web applications using React and TypeScript. Collaborated with UI/UX designers to implement pixel-perfect designs.",
        education: [
          { degree: "Master's Degree", field: "Computer Science", gradYear: "2022", verified: true },
          { degree: "Bachelor's Degree", field: "Software Engineering", gradYear: "2020", verified: false }
        ],
        skills: ["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Figma"],
        badges: ["Frontend Development (React)"],
    },
    {
        email: "ben.traore@example.com",
        name: "Ben Traoré",
        firstName: "Ben",
        lastName: "Traoré",
        role: "graduate",
        status: "pending",
        schoolId: "school_ufhb",
    },

    // --- Companies ---
    {
        email: "contact@orange.ci",
        name: "Orange Côte d'Ivoire",
        role: "company",
        status: "active",
        contactName: "Recruitment Team",
        website: "https://www.orange.ci",
        industry: "Telecommunications",
        description: "Leader des télécommunications, offrant une large gamme de services mobiles, internet et de paiement mobile.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg",
    },
    {
        email: "hr@sifca.com",
        name: "SIFCA",
        role: "company",
        status: "active",
        contactName: "HR Department",
        website: "https://www.groupesifca.com",
        industry: "Agriculture",
        description: "Groupe agro-industriel ivoirien spécialisé dans la production et la commercialisation d'huile de palme, de caoutchouc et de sucre.",
        logoUrl: "https://groupesifca.com/wp-content/uploads/2021/04/Logotype_Sifca-1.png",
    },

    // --- Schools ---
    {
        email: "admin@inphb.ci",
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        role: "school",
        status: "active",
        contactName: "Service des Stages et Emplois",
        website: "https://www.inphb.ci",
        location: "Yamoussoukro",
        description: "Institution d'excellence formant des ingénieurs et techniciens supérieurs dans divers domaines.",
        logoUrl: "https://www.adminsite.inphb.app/Imagessiteprincipal/Icon.png",
    },
    {
        email: "contact@ufhb.edu.ci",
        name: "Université Félix Houphouët-Boigny",
        role: "school",
        status: "pending",
        contactName: "Direction de la Scolarité",
        website: "https://www.univ-fhb.edu.ci",
        location: "Abidjan",
        description: "La plus grande et la plus ancienne université de Côte d'Ivoire.",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
    },

    // --- Admins ---
    {
        email: "admin@yahnu.org",
        name: "Admin User",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        status: "active",
    },
    {
        email: "support@yahnu.org",
        name: "Support User",
        firstName: "Support",
        lastName: "User",
        role: "support_staff",
        status: "active",
    },
];
