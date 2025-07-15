
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import React, { useState, useEffect } from "react";
import { useLocalization } from "@/context/localization-context";

const db = getFirestore(app);

interface Post {
    id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    imageUrl: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();

  useEffect(() => {
    const postsCol = collection(db, 'posts');
    const unsubscribe = onSnapshot(postsCol, (snapshot) => {
        const postList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postList);
        setIsLoading(false);
    }, (err) => {
        console.error("Firestore listen failed:", err);
        setError("Failed to load blog posts. Please check your connection and try again.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [])

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

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        ) : error ? (
            <div className="text-center text-red-500">
                <p>{error}</p>
            </div>
        ) : (
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
                                <h2 className="text-xl font-semibold mb-2">{t(post.title)}</h2>
                                <p className="text-muted-foreground mb-4 text-sm">{t(post.description)}</p>
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
        )}
      </main>
      <Footer />
    </div>
  );
}
