'use server';

/**
 * @fileOverview AI-powered Career Intelligence Engine.
 * Analyzes a graduate's profile and generates personalized career path maps,
 * skill gap analysis, market insights, and salary intelligence.
 *
 * - analyzeCareerIntelligence - Main function for career analysis.
 * - getSmartMatchScore - Scores a job against a graduate's profile.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ─── Career Intelligence Analysis ─────────────────────────────────────────────

const CareerIntelligenceInputSchema = z.object({
  skills: z.array(z.string()).describe('The graduate\'s current skills.'),
  experience: z.array(z.string()).describe('The graduate\'s work experience entries.'),
  education: z.array(z.string()).describe('The graduate\'s education history.'),
  interests: z.string().optional().describe('Career interests or goals described by the graduate.'),
  country: z.string().describe('The graduate\'s country (e.g., "Ivory Coast", "Ghana", "Nigeria").'),
});
export type CareerIntelligenceInput = z.infer<typeof CareerIntelligenceInputSchema>;

const CareerPathSchema = z.object({
  title: z.string().describe('The career path title (e.g., "Data Analyst → Data Scientist → ML Lead").'),
  roles: z.array(z.object({
    title: z.string().describe('Job role title.'),
    yearsFromNow: z.number().describe('Estimated years from now to reach this role.'),
    description: z.string().describe('Brief description of the role.'),
    keySkillsNeeded: z.array(z.string()).describe('Key skills needed for this role.'),
  })).describe('Ordered list of roles in this career trajectory.'),
  fitScore: z.number().min(0).max(100).describe('How well this path fits the graduate\'s current profile (0-100).'),
  reasoning: z.string().describe('Why this path is recommended.'),
});

const SkillGapSchema = z.object({
  skill: z.string().describe('The skill name.'),
  currentLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced']).describe('Estimated current proficiency.'),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Required level for target roles.'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).describe('How important this skill gap is to address.'),
  recommendation: z.string().describe('Specific actionable recommendation to close this gap.'),
});

const MarketInsightSchema = z.object({
  sector: z.string().describe('Industry sector.'),
  demandLevel: z.enum(['very_high', 'high', 'moderate', 'low']).describe('Current demand level in the region.'),
  growthTrend: z.enum(['rapidly_growing', 'growing', 'stable', 'declining']).describe('Growth trend.'),
  topEmployers: z.array(z.string()).describe('Notable employers in this sector in the region.'),
  insight: z.string().describe('A brief market insight or trend for this sector.'),
});

const SalaryRangeSchema = z.object({
  role: z.string().describe('Job role title.'),
  entryLevel: z.string().describe('Entry-level salary range (in local currency).'),
  midLevel: z.string().describe('Mid-level salary range.'),
  seniorLevel: z.string().describe('Senior-level salary range.'),
  currency: z.string().describe('Currency code (e.g., XOF, GHS, NGN).'),
  note: z.string().describe('Additional context about salaries in this role/region.'),
});

const CareerIntelligenceOutputSchema = z.object({
  profileSummary: z.string().describe('A concise AI-generated summary of the graduate\'s professional profile and strengths.'),
  careerPaths: z.array(CareerPathSchema).min(2).max(4).describe('2-4 recommended career paths.'),
  skillGaps: z.array(SkillGapSchema).min(3).max(8).describe('3-8 identified skill gaps with recommendations.'),
  marketInsights: z.array(MarketInsightSchema).min(2).max(4).describe('2-4 relevant market insights for the graduate\'s region.'),
  salaryIntelligence: z.array(SalaryRangeSchema).min(2).max(4).describe('Salary ranges for recommended roles.'),
  topActionItems: z.array(z.string()).min(3).max(5).describe('3-5 prioritized next steps the graduate should take immediately.'),
});
export type CareerIntelligenceOutput = z.infer<typeof CareerIntelligenceOutputSchema>;

const careerIntelligencePrompt = ai.definePrompt({
  name: 'careerIntelligencePrompt',
  input: { schema: CareerIntelligenceInputSchema },
  output: { schema: CareerIntelligenceOutputSchema },
  prompt: `You are an expert career strategist specializing in the African job market, particularly West Africa. You have deep knowledge of job markets in Ivory Coast, Ghana, Nigeria, Senegal, Cameroon, and DR Congo.

Analyze the following graduate profile and provide comprehensive career intelligence:

**Skills:** {{#each skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

**Experience:**
{{#each experience}}
- {{this}}
{{/each}}

**Education:**
{{#each education}}
- {{this}}
{{/each}}

{{#if interests}}
**Career Interests:** {{interests}}
{{/if}}

**Country:** {{country}}

Provide:
1. A concise profile summary highlighting their strengths and potential.
2. 2-4 realistic career paths with specific roles, timelines, and required skills. Each path should have a fit score and reasoning.
3. A skill gap analysis identifying what they need to learn, prioritized by importance, with specific actionable recommendations (courses, certifications, projects).
4. Market insights for their country/region — which sectors are hiring, growth trends, and notable employers.
5. Salary intelligence with realistic ranges in local currency for their country. Use the correct currency (XOF for Ivory Coast/Senegal, GHS for Ghana, NGN for Nigeria, XAF for Cameroon, CDF for DR Congo).
6. 3-5 prioritized action items they should take immediately.

Be specific, realistic, and actionable. Tailor everything to the African context — reference local companies, regional trends, and practical advice. Do not give generic global advice.`,
});

const careerIntelligenceFlow = ai.defineFlow(
  {
    name: 'careerIntelligenceFlow',
    inputSchema: CareerIntelligenceInputSchema,
    outputSchema: CareerIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await careerIntelligencePrompt(input);
    return output!;
  }
);

export async function analyzeCareerIntelligence(input: CareerIntelligenceInput): Promise<CareerIntelligenceOutput> {
  return careerIntelligenceFlow(input);
}

// ─── Smart Match Score ────────────────────────────────────────────────────────

const SmartMatchInputSchema = z.object({
  graduateSkills: z.array(z.string()).describe('The graduate\'s skills.'),
  graduateExperience: z.array(z.string()).describe('The graduate\'s work experience.'),
  graduateEducation: z.array(z.string()).describe('The graduate\'s education.'),
  jobTitle: z.string().describe('The job title.'),
  jobDescription: z.string().describe('The full job description.'),
  jobRequirements: z.string().optional().describe('Specific job requirements.'),
});
export type SmartMatchInput = z.infer<typeof SmartMatchInputSchema>;

const SmartMatchOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall match score (0-100).'),
  breakdown: z.object({
    skillMatch: z.number().min(0).max(100).describe('Skills match score.'),
    experienceMatch: z.number().min(0).max(100).describe('Experience match score.'),
    educationMatch: z.number().min(0).max(100).describe('Education match score.'),
  }),
  strengths: z.array(z.string()).min(1).max(4).describe('What makes this graduate a good fit.'),
  gaps: z.array(z.string()).min(0).max(4).describe('Areas where the graduate falls short.'),
  recommendation: z.string().describe('A brief recommendation — should they apply, and how to strengthen their application.'),
  verdict: z.enum(['strong_match', 'good_match', 'partial_match', 'weak_match']).describe('Overall match verdict.'),
});
export type SmartMatchOutput = z.infer<typeof SmartMatchOutputSchema>;

const smartMatchPrompt = ai.definePrompt({
  name: 'smartMatchPrompt',
  input: { schema: SmartMatchInputSchema },
  output: { schema: SmartMatchOutputSchema },
  prompt: `You are a recruitment AI specialist. Score how well a candidate matches a specific job posting.

**Candidate Profile:**
Skills: {{#each graduateSkills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

Experience:
{{#each graduateExperience}}
- {{this}}
{{/each}}

Education:
{{#each graduateEducation}}
- {{this}}
{{/each}}

**Job Posting:**
Title: {{jobTitle}}
Description: {{jobDescription}}
{{#if jobRequirements}}Requirements: {{jobRequirements}}{{/if}}

Provide an honest, detailed match analysis. Be encouraging but realistic. Score each dimension (skills, experience, education) independently, then give an overall score. Identify specific strengths and gaps. Give actionable advice on whether to apply and how to improve the application.`,
});

const smartMatchFlow = ai.defineFlow(
  {
    name: 'smartMatchFlow',
    inputSchema: SmartMatchInputSchema,
    outputSchema: SmartMatchOutputSchema,
  },
  async (input) => {
    const { output } = await smartMatchPrompt(input);
    return output!;
  }
);

export async function getSmartMatchScore(input: SmartMatchInput): Promise<SmartMatchOutput> {
  return smartMatchFlow(input);
}
