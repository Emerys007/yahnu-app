import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1">
        <HeroSection />

        <section className="py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Get Started?</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                Join Yahnu today and take the next step in your professional journey. Whether you're looking for a job, hiring new talent, or seeking partnerships, we have the tools for you.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild>
                    <Link href="/register">Sign Up Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </section>
      </main>
      <footer className="bg-muted p-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Yahnu. All Rights Reserved.
      </footer>
    </div>
  );
}
