import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock3, RefreshCw } from 'lucide-react';

import { BlogCoverImage } from '@/components/blog/blog-cover-image';
import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { JsonLd } from '@/components/seo/json-ld';
import { SafeRichText } from '@/components/ui/safe-rich-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { blogHtmlToPlainText } from '@/lib/blog';
import { getPublishedBlogPostBySlug } from '@/lib/blog-server';
import { absoluteUrl, privatePageMetadata, publicPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  try {
    const post = await getPublishedBlogPostBySlug(slug);
    if (!post) return privatePageMetadata('Article introuvable');

    const base = publicPageMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${post.slug}`,
      image: post.imageUrl,
    });
    return {
      ...base,
      openGraph: {
        ...base.openGraph,
        type: 'article' as const,
        publishedTime: post.publishedAt ?? post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [post.author],
      },
    };
  } catch {
    return privatePageMetadata('Article momentanément indisponible');
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  let post;
  let loadFailed = false;

  try {
    post = await getPublishedBlogPostBySlug(slug);
  } catch (error) {
    console.error(`Unable to load blog post ${slug}:`, error);
    loadFailed = true;
  }

  if (!loadFailed && !post) notFound();

  if (loadFailed || !post) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainNav />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
          <Card className="w-full max-w-xl border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center p-10 text-center">
              <RefreshCw className="h-9 w-9 text-destructive" />
              <h1 className="mt-4 text-2xl font-semibold">Article momentanément indisponible</h1>
              <p className="mt-2 text-muted-foreground">Nous n’avons pas pu charger cet article. Réessayez dans quelques instants.</p>
              <Button asChild variant="outline" className="mt-6"><Link href={`/blog/${slug}`}>Réessayer</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const date = post.publishedAt ?? post.createdAt;
  const wordCount = blogHtmlToPlainText(post.contentHtml).split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': absoluteUrl(`/blog/${post.slug}#article`),
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl ? absoluteUrl(post.imageUrl) : absoluteUrl('/opengraph-image'),
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'fr-CI',
    author: { '@type': 'Person', name: post.author },
    publisher: { '@id': absoluteUrl('/#organization') },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <MainNav />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pb-16">
            <Button asChild variant="ghost" className="-ml-3 mb-8 text-muted-foreground hover:text-foreground">
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog</Link>
            </Button>
            <Badge variant="secondary">Ressource Yahnu</Badge>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Par {post.author}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={date}>{dateFormatter.format(new Date(date))}</time>
              <span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {readingMinutes} min de lecture</span>
            </div>
          </div>
        </header>

        <article className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <BlogCoverImage src={post.imageUrl} alt={post.title} eager className="mb-10 aspect-[16/8] rounded-3xl shadow-sm" />
          <SafeRichText
            html={post.contentHtml}
            className="mx-auto max-w-3xl text-base leading-8 prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:text-primary sm:text-lg"
          />
          <div className="mx-auto mt-12 max-w-3xl border-t pt-8">
            <Button asChild variant="outline"><Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Voir tous les articles</Link></Button>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
