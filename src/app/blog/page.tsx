
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

// This is mock data. In a real application, you would fetch this from a CMS.
const posts = [
  {
    slug: "unlocking-potential-the-yahnu-story",
    title: "Unlocking Potential: The Yahnu Story",
    description: "Discover the mission and vision behind Yahnu and how we're bridging the gap between education and employment in Côte d'Ivoire.",
    author: "Dr. Evelyn Reed",
    date: "2023-10-26",
    imageUrl: "/images/yahnu-logo.png",
  },
    {
    slug: "top-5-in-demand-skills-for-graduates",
    title: "Top 5 In-Demand Skills for Graduates in 2024",
    description: "Stay ahead of the curve. We analyze the current job market to bring you the most sought-after skills by top companies.",
    author: "John Carter",
    date: "2023-11-05",
    imageUrl: "/images/job-data-scientist.jpg",
  },
  {
    slug: "crafting-the-perfect-resume",
    title: "Crafting the Perfect Resume: A Guide for Tech Graduates",
    description: "Your resume is your first impression. Learn how to tailor your resume to land your dream job in the tech industry.",
    author: "Emily Chen",
    date: "2023-11-12",
    imageUrl: "/images/dream-job.jpg",
  },
  {
    slug: "the-power-of-university-industry-partnerships",
    title: "The Power of University-Industry Partnerships",
    description: "Explore how collaborations between universities and companies are shaping the future of talent and innovation.",
    author: "David Lee",
    date: "2023-11-20",
    imageUrl: "/images/uni-partnership.jpg",
  },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">Yahnu Insights</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Your premier source for career advice, industry trends, and success stories in the Ivorian professional landscape.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
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
                                Read More <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
