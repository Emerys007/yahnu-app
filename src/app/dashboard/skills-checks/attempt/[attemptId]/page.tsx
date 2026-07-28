import { SkillsCheckAttempt } from "@/components/skills/skills-check-attempt";

export default async function SkillsCheckAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <SkillsCheckAttempt attemptId={attemptId} />;
}
