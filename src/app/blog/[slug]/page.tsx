
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";
import { allPosts } from "@/lib/demo-data";
import { allPosts as frPosts } from "@/lib/fr";

interface Post {
    slug: string;
    title: string;
    brief: string;
    author: string;
    date: string;
    image: string;
    content: string;
}

function getPostBySlug(slug: string, lang: string): Post | undefined {
    const posts = lang === 'fr' ? frPosts : allPosts;
    return posts.find((p) => p.slug === slug);
}

export default function BlogPostPage() {
  const params = useParams();
  const { lang, t } = useLocalization();
  const slug = params.slug as string;
  const post = getPostBySlug(slug, lang);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <article className="prose lg:prose-xl max-w-4xl mx-auto">
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground">{t('By')} {t(post.author)} on {new Date(post.date).toLocaleDateString()}</p>
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
