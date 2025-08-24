
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
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

async function getPostBySlug(slug: string): Promise<Post | null> {
    const postsCollection = collection(db, "blogPosts");
    const q = query(postsCollection, where("slug", "==", slug), where("status", "==", "published"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as DocumentData;
    
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
    } as Post;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
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
              src={post.imageUrl || `https://source.unsplash.com/random/800x600?sig=${post.id}`}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground mb-6">
            Par {post.author} • {post.createdAt ? format(post.createdAt, "d MMMM yyyy", { locale: fr }) : ''}
          </p>
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
