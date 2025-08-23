
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { allPosts } from "@/lib/demo-data";
import Link from "next/link";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  // This component will now only display in French.
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const localizedPost = {
    title: post.title.fr,
    content: post.content.fr,
    author: post.author,
    date: post.date,
    image: post.image,
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-4xl mx-auto mb-8">
            <Link href="/blog" className="text-primary hover:underline">← Retour au blog</Link>
        </div>
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
            Par Auteur du blog • {new Date(localizedPost.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: localizedPost.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
