
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import React from "react";
import { useLocalization } from "@/context/localization-context";
import { cn } from "@/lib/utils";
import { allPosts } from "@/lib/demo-data";
import { allPosts as frPosts } from "@/lib/fr";

interface Post {
    slug: string;
    title: string;
    brief: string;
    author: string;
    date: string;
    image: string;
}

const getMockPosts = (lang: string, t: (key: string) => string): Post[] => {
    const posts = lang === 'fr' ? frPosts : allPosts;
    return posts.map(post => ({
        ...post,
        author: t(post.author),
    }));
};

export default function BlogPage() {
  const { t, lang } = useLocalization();
  const posts = getMockPosts(lang, t);

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

        <div className="flex flex-wrap justify-center -m-4">
            {posts.map((post, index) => (
                <div key={post.slug} className="w-full sm:w-1/2 lg:w-1/3 p-4 flex">
                    <Link href={`/blog/${post.slug}`} className="block h-full w-full">
                        <Card className="h-full w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                            <CardHeader className="p-0">
                               <div className="relative w-full h-48">
                                 <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                    priority={index < 3}
                                />
                               </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                                <p className="text-muted-foreground mb-4 text-sm line-clamp-3">{post.brief}</p>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{t('By')} {post.author}</span>
                                    <span>{new Date(post.date).toLocaleDateString()}</span>
                                </div>
                                 <div className="flex items-center mt-4 font-semibold text-primary">
                                    {t('Read More')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
