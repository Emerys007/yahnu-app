import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />

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
      <Footer />
    </div>
  );
}
