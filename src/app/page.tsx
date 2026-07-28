import HomePage from "@/components/landing/home-page";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Insertion professionnelle en Côte d’Ivoire",
  description:
    "Yahnu aide les jeunes diplômés ivoiriens à rendre leurs compétences visibles, découvrir des opportunités fiables et avancer avec les écoles et les employeurs.",
  path: "/",
  keywords: [
    "emploi jeune diplômé Côte d’Ivoire",
    "offres d’emploi Abidjan",
    "stages Côte d’Ivoire",
    "compétences professionnelles",
  ],
});

const faqItems = [
  {
    question: "Qu’est-ce que Yahnu ?",
    answer:
      "Yahnu est une plateforme d’insertion professionnelle pensée en Côte d’Ivoire. Elle relie les jeunes diplômés, les établissements et les employeurs autour de profils, d’opportunités, de compétences et de résultats mesurables.",
  },
  {
    question: "Qui peut créer un compte Yahnu ?",
    answer:
      "Les jeunes diplômés, les entreprises et les établissements peuvent créer un espace. Chaque rôle dispose d’outils adaptés : recherche d’emploi et compétences, recrutement, suivi de cohortes et partenariats.",
  },
  {
    question: "Comment Yahnu vérifie-t-il les offres externes ?",
    answer:
      "Yahnu utilise des sources officielles approuvées, conserve la provenance et la date de vérification, retire les offres périmées et indique clairement quand la candidature se poursuit sur le site de l’employeur.",
  },
  {
    question: "Un Yahnu Skills Check est-il un diplôme ?",
    answer:
      "Non. Il produit une attestation Yahnu sous conditions vérifiées : test chronométré, questions randomisées et notation côté serveur. Il ne remplace ni un diplôme, ni une certification accréditée, ni une surveillance humaine.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": absoluteUrl("/#faq"),
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <HomePage />
    </>
  );
}
