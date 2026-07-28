import type { MetadataRoute } from "next";

import { getPublishedBlogPosts } from "@/lib/blog-server";
import { listPublicOrganizations } from "@/lib/public-organizations-server";
import { absoluteUrl } from "@/lib/seo";

const staticPages: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.95 },
  { path: "/students", changeFrequency: "monthly", priority: 0.85 },
  { path: "/schools", changeFrequency: "weekly", priority: 0.8 },
  { path: "/companies", changeFrequency: "weekly", priority: 0.8 },
  { path: "/institutions", changeFrequency: "monthly", priority: 0.75 },
  { path: "/be-the-change", changeFrequency: "monthly", priority: 0.75 },
  { path: "/impact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/methodologie", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.55 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const posts = await getPublishedBlogPosts(100, 0);
    entries.push(
      ...posts.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.65,
      })),
    );
  } catch (error) {
    console.error("Unable to include blog posts in the sitemap.", error);
  }

  try {
    const [companies, schools] = await Promise.all([
      listPublicOrganizations("company"),
      listPublicOrganizations("school"),
    ]);
    entries.push(
      ...companies.map((organization) => ({
        url: absoluteUrl(`/companies/${organization.slug}`),
        lastModified: organization.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...schools.map((organization) => ({
        url: absoluteUrl(`/schools/${organization.slug}`),
        lastModified: organization.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
    );
  } catch (error) {
    console.error("Unable to include public organizations in the sitemap.", error);
  }

  return entries;
}
