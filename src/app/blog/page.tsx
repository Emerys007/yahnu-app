
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import React from "react";
import { useLocalization } from "@/context/localization-context";

interface Post {
    id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    imageUrl: string;
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
    },
    {
        id: "2",
        slug: "top-tech-skills-abidjan",
        title: t('blog_2_title'),
        description: t('blog_2_desc'),
        author: "B. Traoré",
        date: "July 10, 2024",
        imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2670&auto=format&fit=crop",
    },
    {
        id: "3",
        slug: "interview-tips-success-ci",
        title: t('blog_3_title'),
        description: t('blog_3_desc'),
        author: "C. Fofana",
        date: "July 5, 2024",
        imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2670&auto=format&fit=crop",
    }
];

export default function BlogPage() {
  const { t } = useLocalization();
  const posts = getMockPosts(t);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('Yahnu Insights')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('Your premier source for career advice, industry trends, and success stories in the Ivorian professional landscape.')}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                    <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                        <CardHeader className="p-0">
                           <div className="relative w-full h-48">
                             <Image
                                src={post.imageUrl}
                                alt={post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                            />
                           </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                            <p className="text-muted-foreground mb-4 text-sm">{post.description}</p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>By {post.author}</span>
                                <span>{post.date}</span>
                            </div>
                             <div className="flex items-center mt-4 font-semibold text-primary">
                                {t('Read More')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
