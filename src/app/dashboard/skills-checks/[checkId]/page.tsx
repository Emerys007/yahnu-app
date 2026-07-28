import { SkillsCheckIntro } from "@/components/skills/skills-check-intro";

export default async function SkillsCheckIntroPage({
  params,
}: {
  params: Promise<{ checkId: string }>;
}) {
  const { checkId } = await params;
  return <SkillsCheckIntro checkId={checkId} />;
}
