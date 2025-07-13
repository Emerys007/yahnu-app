
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Coming soon!
        </p>
      </main>
      <Footer />
    </div>
  );
}
