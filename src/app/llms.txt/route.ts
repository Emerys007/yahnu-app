import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Yahnu",
    "",
    "> Yahnu relie les jeunes diplômés, les établissements et les employeurs en Côte d’Ivoire.",
    "",
    "## Pages de référence",
    `- Présentation: ${absoluteUrl("/about")}`,
    `- Emplois et stages: ${absoluteUrl("/jobs")}`,
    `- Écoles et universités: ${absoluteUrl("/schools")}`,
    `- Entreprises: ${absoluteUrl("/companies")}`,
    `- Méthodologie et confiance: ${absoluteUrl("/methodologie")}`,
    `- Impact: ${absoluteUrl("/impact")}`,
    `- Journal: ${absoluteUrl("/blog")}`,
    "",
    "## Principes de confiance",
    "- Les opportunités externes renvoient vers leur source officielle et affichent leur fraîcheur.",
    "- Les Yahnu Skills Checks sont des attestations de compétences sous conditions vérifiées, pas des diplômes accrédités.",
    "- Les candidats contrôlent la visibilité de leur profil et de leurs attestations.",
    "- Les objectifs de phase pilote ne sont jamais présentés comme des résultats déjà obtenus.",
    "",
    `Contact: ${absoluteUrl("/contact")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
