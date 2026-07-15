import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';

import { BlogCoverImage } from '@/components/blog/blog-cover-image';
import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BlogPost } from '@/lib/blog';
import { getPublishedBlogPosts } from '@/lib/blog-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | Yahnu',
  description: 'Conseils, analyses et histoires pour faire progresser les talents et les organisations en Afrique.',
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function PostMeta({ post }: { post: BlogPost }) {
  const date = post.publishedAt ?? post.createdAt;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>Par {post.author}</span>
      <span aria-hidden="true">•</span>
      <time dateTime={date}>{dateFormatter.format(new Date(date))}</time>
    </div>
  );
}

function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
      <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="grid min-h-[360px] lg:grid-cols-[1.15fr_0.85fr]">
          <BlogCoverImage src={post.imageUrl} alt={post.title} eager className="min-h-64 lg:min-h-full" />
          <CardContent className="flex flex-col justify-center p-7 sm:p-10">
            <Badge className="mb-5 w-fit" variant="secondary">À la une</Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h2>
            <p className="mt-4 line-clamp-3 text-base leading-7 text-muted-foreground">{post.excerpt}</p>
            <div className="mt-6"><PostMeta post={post} /></div>
            <span className="mt-7 inline-flex items-center font-semibold text-primary">
              Lire l’article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
      <Card className="flex h-full flex-col overflow-hidden border-border/60 bg-card transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <BlogCoverImage src={post.imageUrl} alt={post.title} className="h-52" />
        <CardContent className="flex flex-1 flex-col p-6">
          <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight">{post.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5"><PostMeta post={post} /></div>
          <span className="mt-auto inline-flex items-center pt-6 text-sm font-semibold text-primary">
            Lire la suite <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

const PAGE_SIZE = 24;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number.parseInt((await searchParams).page ?? '1', 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 4_167)
    : 1;
  let posts: BlogPost[] = [];
  let loadFailed = false;
  try {
    posts = await getPublishedBlogPosts(PAGE_SIZE + 1, (page - 1) * PAGE_SIZE);
  } catch (error) {
    console.error('Unable to load published blog posts:', error);
    loadFailed = true;
  }

  const hasNextPage = posts.length > PAGE_SIZE;
  const visiblePosts = posts.slice(0, PAGE_SIZE);
  const [featured, ...remaining] = visiblePosts;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="pointer-events-none absolute inset-x-0 -top-48 mx-auto h-96 max-w-4xl rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative mx-auto px-4 py-16 text-center sm:py-24">
            <Badge variant="outline" className="mb-5 border-primary/30 bg-background/70 px-3 py-1 text-primary backdrop-blur">
              Le carnet Yahnu
            </Badge>
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Des idées pour transformer le potentiel en impact
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              Analyses, conseils et histoires concrètes sur l’emploi, les talents et l’avenir du travail en Afrique.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          {loadFailed ? (
            <Card className="mx-auto max-w-2xl border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col items-center p-10 text-center">
                <RefreshCw className="h-9 w-9 text-destructive" />
                <h2 className="mt-4 text-xl font-semibold">Le blog est momentanément indisponible</h2>
                <p className="mt-2 max-w-md text-muted-foreground">Nous n’avons pas pu charger les articles. Réessayez dans quelques instants.</p>
                <Button asChild variant="outline" className="mt-6"><Link href="/blog">Réessayer</Link></Button>
              </CardContent>
            </Card>
          ) : !featured ? (
            <Card className="mx-auto max-w-2xl border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center p-12 text-center">
                <div className="rounded-2xl bg-primary/10 p-4"><BookOpen className="h-8 w-8 text-primary" /></div>
                <h2 className="mt-5 text-2xl font-semibold">{page > 1 ? 'Cette page ne contient plus d’articles' : 'Les premières histoires arrivent bientôt'}</h2>
                <p className="mt-2 max-w-md text-muted-foreground">{page > 1 ? 'Revenez à la page précédente pour poursuivre votre lecture.' : 'Notre équipe prépare des ressources utiles pour votre parcours professionnel.'}</p>
                <Button asChild className="mt-6"><Link href={page > 1 ? (page === 2 ? '/blog' : `/blog?page=${page - 1}`) : '/'}>{page > 1 ? 'Revenir aux articles' : 'Découvrir Yahnu'}</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              <FeaturedPost post={featured} />
              {remaining.length > 0 && (
                <div>
                  <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">À explorer</p>
                      <h2 className="mt-2 text-3xl font-bold tracking-tight">Derniers articles</h2>
                    </div>
                    <p className="hidden text-sm text-muted-foreground sm:block">{visiblePosts.length} article{visiblePosts.length > 1 ? 's' : ''} sur cette page</p>
                  </div>
                  <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {remaining.map((post) => <PostCard key={post.id} post={post} />)}
                  </div>
                </div>
              )}
              {(page > 1 || hasNextPage) && (
                <nav className="flex flex-wrap items-center justify-between gap-3 border-t pt-8" aria-label="Pagination du blog">
                  {page > 1 ? (
                    <Button asChild variant="outline"><Link href={page === 2 ? '/blog' : `/blog?page=${page - 1}`}><ArrowLeft className="mr-2 h-4 w-4" /> Articles précédents</Link></Button>
                  ) : <span />}
                  {hasNextPage ? (
                    <Button asChild><Link href={`/blog?page=${page + 1}`}>Articles suivants <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  ) : <span />}
                </nav>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
