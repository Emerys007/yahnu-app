import type { Metadata } from "next"

import { BlogManager } from "@/components/blog/blog-manager"

export const metadata: Metadata = {
  title: "Rédaction du blog · Yahnu",
  description: "Publier les histoires, conseils et parcours de la communauté Yahnu en Côte d’Ivoire.",
}

export default function AdminBlogPage() {
  return <BlogManager />
}
