import { notFound } from 'next/navigation';

import { PublicOrganizationProfile } from '@/components/organizations/public-organization-profile';
import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { getPublicOrganizationById } from '@/lib/public-organizations-server';

export const dynamic = 'force-dynamic';

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await getPublicOrganizationById('school', slug);

  if (!school) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="container mx-auto flex-1 py-10 sm:py-12">
        <PublicOrganizationProfile organization={school} role="school" />
      </main>
      <Footer />
    </div>
  );
}
