"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";
import { allPosts } from "@/lib/demo-data";

export default function BlogPostPage() {
  const params = useParams();
  const { t, language } = useLocalization();
  const slug = params.slug as string;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const localizedPost = {
    title: post.title[language as 'en' | 'fr'],
    content: post.content[language as 'en' | 'fr'],
    author: t(post.author),
    date: post.date,
    image: post.image,
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <article className="prose lg:prose-xl max-w-4xl mx-auto">
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={localizedPost.image}
              alt={localizedPost.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{localizedPost.title}</h1>
          <p className="text-muted-foreground mb-6">
            {t('common.by')} {t('blog.author_name')} • {new Date(localizedPost.date).toLocaleDateString()}
          </p>
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: localizedPost.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}