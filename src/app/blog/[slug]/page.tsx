

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

interface Post {
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    imageUrl: string;
    content: string;
}

async function getPostBySlug(slug: string): Promise<Post | null> {
    const q = query(collection(db, "posts"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const postDoc = querySnapshot.docs[0];
    return { id: postDoc.id, ...postDoc.data() } as Post;
}

// Note: This page would need a client component to use the localization hook.
// For this static generation example, we'll assume the fetched content is already localized or doesn't need it.
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <article className="prose lg:prose-xl max-w-none">
          <div className="relative w-full h-96 mb-8">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground">By {post.author} on {post.date}</p>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
