import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { ManagedOpportunityDetail } from "@/components/market/managed-opportunity-detail";

export default async function VerifiedOpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <ManagedOpportunityDetail slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
