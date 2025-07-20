
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";

interface Post {
    id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    imageUrl: string;
    content: string;
}

const getMockPosts = (t: (key: string) => string): Post[] => [
    {
        id: "1",
        slug: "navigating-job-market-ci",
        title: t('blog_1_title'),
        description: t('blog_1_desc'),
        author: "A. Kouassi",
        date: "July 15, 2024",
        imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop",
        content: t('blog_1_content')
    },
    {
        id: "2",
        slug: "top-tech-skills-abidjan",
        title: t('blog_2_title'),
        description: t('blog_2_desc'),
        author: "B. Traoré",
        date: "July 10, 2024",
        imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2670&auto=format&fit=crop",
        content: t('blog_2_content')
    },
    {
        id: "3",
        slug: "interview-tips-success-ci",
        title: t('blog_3_title'),
        description: t('blog_3_desc'),
        author: "C. Fofana",
        date: "July 5, 2024",
        imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2670&auto=format&fit=crop",
        content: t('blog_3_content')
    }
];

function getPostBySlug(slug: string, t: (key: string) => string): Post | null {
    const posts = getMockPosts(t);
    const post = posts.find((p) => p.slug === slug);
    return post || null;
}

export default function BlogPostPage() {
  const params = useParams();
  const { t } = useLocalization();
  const slug = params.slug as string;
  const post = getPostBySlug(slug, t);

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
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground">By {post.author} on {new Date(post.date).toLocaleDateString()}</p>
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
