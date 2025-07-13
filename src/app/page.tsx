import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />

        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Yahnu?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              We are dedicated to bridging the gap between talent and opportunity in Côte d'Ivoire.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center p-6 border rounded-lg bg-card shadow-sm">
                <h3 className="text-xl font-semibold">For Graduates</h3>
                <p className="mt-2 text-muted-foreground">Discover exclusive job listings and launch your career with confidence.</p>
              </div>
              <div className="flex flex-col items-center p-6 border rounded-lg bg-card shadow-sm">
                <h3 className="text-xl font-semibold">For Companies</h3>
                <p className="mt-2 text-muted-foreground">Recruit top-tier talent from leading universities efficiently.</p>
              </div>
              <div className="flex flex-col items-center p-6 border rounded-lg bg-card shadow-sm">
                <h3 className="text-xl font-semibold">For Schools</h3>
                <p className="mt-2 text-muted-foreground">Forge impactful partnerships and enhance your graduates' prospects.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/40">
          <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Get Started?</h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                  Join Yahnu today and take the next step in your professional journey. Whether you're looking for a job, hiring new talent, or seeking partnerships, we have the tools for you.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                  <Button size="lg" asChild>
                      <Link href="/register">Sign Up Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                      <Link href="/login">Explore Platform</Link>
                  </Button>
              </div>
          </div>
        </section>
      </main>
      <footer className="bg-background border-t">
        <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Yahnu. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
