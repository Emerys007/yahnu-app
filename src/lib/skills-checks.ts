import { z } from 'zod';

export const SKILLS_CONDITIONS_VERSION = 'skills-conditions-2026-07-25';
export const SKILLS_PRIVACY_NOTICE_VERSION = 'skills-privacy-2026-07-25';
export const SKILLS_PUBLIC_CONSENT_VERSION = 'skills-public-consent-2026-07-25';

export const skillsAccommodationCodes = [
  'none',
  'extra_time_25',
  'extra_time_50',
] as const;

export const skillsAccommodationSchema = z.enum(skillsAccommodationCodes);
export type SkillsAccommodationCode = z.infer<typeof skillsAccommodationSchema>;

export const integritySignalKinds = ['visibility_hidden', 'focus_lost'] as const;
export const integritySignalSchema = z.enum(integritySignalKinds);
export type IntegritySignalKind = z.infer<typeof integritySignalSchema>;

export type SkillsQuestionManifestEntry = {
  questionId: string;
  optionOrder: number[];
};

export type SkillsCheckSummary = {
  id: string;
  title: string;
  description: string;
  skillArea: string;
  version: number;
  durationSeconds: number;
  questionsPerAttempt: number;
  passingScore: number;
  cooldownHours: number;
  maxAttempts30Days: number;
  attemptsUsed30Days: number;
  activeAttemptId?: string;
  nextAvailableAt?: string;
  latestScore?: number;
  latestPassed?: boolean;
  attestation?: SkillsAttestationSummary;
};

export type SkillsAttemptQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type SkillsAttemptView = {
  id: string;
  checkId: string;
  checkTitle: string;
  status: 'in_progress' | 'submitted' | 'expired' | 'voided';
  startedAt: string;
  expiresAt: string;
  serverNow: string;
  accommodationCode: SkillsAccommodationCode;
  accommodationSeconds: number;
  passingScore: number;
  cooldownHours: number;
  questions: SkillsAttemptQuestion[];
  integritySignalCount: number;
  integrityReviewStatus:
    | 'clear'
    | 'review_suggested'
    | 'reviewed_clear'
    | 'confirmed_concern'
    | 'review_expired';
  score?: number;
  passed?: boolean;
};

export type SkillsAttestationSummary = {
  id: string;
  checkId: string;
  title: string;
  score: number;
  issuedAt: string;
  verificationCode: string;
  isPublic: boolean;
  reviewStatus: SkillsAttemptView['integrityReviewStatus'];
  revokedAt?: string;
};

export function accommodationSeconds(
  durationSeconds: number,
  code: SkillsAccommodationCode,
) {
  if (code === 'extra_time_25') return Math.floor(durationSeconds * 0.25);
  if (code === 'extra_time_50') return Math.floor(durationSeconds * 0.5);
  return 0;
}

export function createRandomizedManifest(
  questions: ReadonlyArray<{ id: string; optionCount: number }>,
  count: number,
  randomIndex: (maximumExclusive: number) => number,
): SkillsQuestionManifestEntry[] {
  if (!Number.isInteger(count) || count < 1 || count > questions.length) {
    throw new Error('The requested question count is outside the available pool.');
  }

  const shuffledQuestions = [...questions];
  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new Error('The random source returned an invalid index.');
    }
    [shuffledQuestions[index], shuffledQuestions[swapIndex]] = [
      shuffledQuestions[swapIndex],
      shuffledQuestions[index],
    ];
  }

  return shuffledQuestions.slice(0, count).map((question) => {
    const optionOrder = Array.from({ length: question.optionCount }, (_, index) => index);
    for (let index = optionOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
        throw new Error('The random source returned an invalid index.');
      }
      [optionOrder[index], optionOrder[swapIndex]] = [
        optionOrder[swapIndex],
        optionOrder[index],
      ];
    }
    return { questionId: question.id, optionOrder };
  });
}

export function remainingAttemptSeconds(
  serverNow: string | Date,
  expiresAt: string | Date,
) {
  const remainingMilliseconds =
    new Date(expiresAt).getTime() - new Date(serverNow).getTime();
  return Math.max(0, Math.ceil(remainingMilliseconds / 1000));
}
