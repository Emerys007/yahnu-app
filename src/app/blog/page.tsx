
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, DocumentData } from "firebase/firestore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

type Post = {
    id: string;
    title: string;
    slug: string;
    author: string;
    content: string;
    excerpt?: string;
    imageUrl?: string;
    createdAt: any;
};

async function getPublishedPosts(): Promise<Post[]> {
    const postsCollection = collection(db, "blogPosts");
    const q = query(postsCollection, where("status", "==", "published"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(), // Convert Firestore Timestamp to JS Date
        } as Post;
    });
}

export default async function BlogPage() {
    const posts = await getPublishedPosts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {"Découvrez des articles, des aperçus et des conseils sur l'avancement de carrière et les tendances de l'industrie."}
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
                 <div key={post.id} className="flex justify-center">
                    <Link href={`/blog/${post.slug}`} className="block h-full w-full max-w-sm">
                        <Card className="h-full w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                            <CardHeader className="p-0">
                               <div className="relative w-full h-48">
                                 <Image
                                    src={post.imageUrl || `https://source.unsplash.com/random/400x300?sig=${index}`}
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
                                <p className="text-muted-foreground mb-4 text-sm line-clamp-3">{post.excerpt}</p>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Par {post.author}</span>
                                    <span>{post.createdAt ? format(post.createdAt, "d MMMM yyyy", { locale: fr }) : ''}</span>
                                </div>
                                 <div className="flex items-center mt-4 font-semibold text-primary">
                                    Lire la suite <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
