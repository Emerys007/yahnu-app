
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getFirestore, collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

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

async function getPostBySlug(slug: string): Promise<Post | null> {
    const q = query(collection(db, "posts"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const postDoc = querySnapshot.docs[0];
    const data = postDoc.data() as DocumentData;
    return { 
        id: postDoc.id, 
        slug: data.slug,
        title: data.title,
        description: data.description,
        author: data.author,
        date: data.date,
        imageUrl: data.imageUrl,
        content: data.content
    } as Post;
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
