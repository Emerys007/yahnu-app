
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";

// This is mock data. In a real application, you would fetch this from a CMS.
const postsData = {
  en: [
    {
      slug: "unlocking-potential-the-yahnu-story",
      title: "Unlocking Potential: The Yahnu Story",
      description: "Discover the mission and vision behind Yahnu and how we're bridging the gap between education and employment in Côte d'Ivoire.",
      author: "Dr. Evelyn Reed",
      date: "2023-10-26",
      imageUrl: "/images/yahnu-logo.png",
      content: `
        <p class="lead mb-8 text-xl text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.</p>
        <p class="mb-6">Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
        <h2 class="text-2xl font-bold my-6">Our Mission</h2>
        <p class="mb-6">Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.</p>
        <h2 class="text-2xl font-bold my-6">The Yahnu Platform</h2>
        <p class="mb-6">Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit.</p>
      `
    },
  ],
  fr: [
      {
      slug: "unlocking-potential-the-yahnu-story",
      title: "Libérer le potentiel : L'histoire de Yahnu",
      description: "Découvrez la mission et la vision de Yahnu et comment nous comblons le fossé entre l'éducation et l'emploi en Côte d'Ivoire.",
      author: "Dr. Evelyn Reed",
      date: "2023-10-26",
      imageUrl: "/images/yahnu-logo.png",
      content: `
        <p class="lead mb-8 text-xl text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.</p>
        <p class="mb-6">Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
        <h2 class="text-2xl font-bold my-6">Notre Mission</h2>
        <p class="mb-6">Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.</p>
        <h2 class="text-2xl font-bold my-6">La Plateforme Yahnu</h2>
        <p class="mb-6">Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit.</p>
      `
    },
  ]
};


export async function generateStaticParams() {
  return postsData.en.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLocalization();
  const posts = postsData[language as keyof typeof postsData] || postsData.en;
  const post = posts.find((p) => p.slug === params.slug);

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
          <p className="text-muted-foreground">{t('By')} {post.author} on {post.date}</p>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
