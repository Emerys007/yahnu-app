import { TalentProfileClient } from "@/components/dashboard/talent-profile-client"

export default async function TalentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TalentProfileClient id={slug} />
}
