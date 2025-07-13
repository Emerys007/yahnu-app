
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function SchoolsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Partner Schools</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Explore our network of leading educational institutions.
            </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>Our school directory is under construction.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center py-20">
                <GraduationCap className="h-16 w-16 text-muted-foreground mb-4"/>
                <p className="text-lg font-semibold">We are building connections with top schools.</p>
                <p className="text-muted-foreground mt-2">Check back soon to learn more about our academic partners and their programs.</p>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
