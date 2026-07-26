import { z } from 'zod';

export const pilotInquiryKinds = [
  'pilot',
  'partnership',
  'employer',
  'school',
  'product',
  'other',
] as const;

export const pilotInquiryOrganizationTypes = [
  'public_institution',
  'university',
  'company',
  'ngo',
  'funder',
  'community',
  'other',
] as const;

export const pilotInquiryTimelines = [
  'now',
  'three_months',
  'six_months',
  'exploring',
] as const;

export const pilotInquiryStatuses = [
  'new',
  'reviewing',
  'contacted',
  'qualified',
  'closed',
] as const;

// ISO 3166-1 alpha-2 countries and territories in Africa. Côte d’Ivoire is
// intentionally first for the primary market; the rest are alphabetical.
export const pilotInquiryCountries = [
  { code: 'CI', fr: 'Côte d’Ivoire', en: 'Côte d’Ivoire' },
  { code: 'ZA', fr: 'Afrique du Sud', en: 'South Africa' },
  { code: 'DZ', fr: 'Algérie', en: 'Algeria' },
  { code: 'AO', fr: 'Angola', en: 'Angola' },
  { code: 'BJ', fr: 'Bénin', en: 'Benin' },
  { code: 'BW', fr: 'Botswana', en: 'Botswana' },
  { code: 'BF', fr: 'Burkina Faso', en: 'Burkina Faso' },
  { code: 'BI', fr: 'Burundi', en: 'Burundi' },
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon' },
  { code: 'CV', fr: 'Cap-Vert', en: 'Cabo Verde' },
  { code: 'KM', fr: 'Comores', en: 'Comoros' },
  { code: 'CG', fr: 'Congo', en: 'Republic of the Congo' },
  { code: 'CD', fr: 'Congo (RDC)', en: 'Democratic Republic of the Congo' },
  { code: 'DJ', fr: 'Djibouti', en: 'Djibouti' },
  { code: 'EG', fr: 'Égypte', en: 'Egypt' },
  { code: 'ER', fr: 'Érythrée', en: 'Eritrea' },
  { code: 'SZ', fr: 'Eswatini', en: 'Eswatini' },
  { code: 'ET', fr: 'Éthiopie', en: 'Ethiopia' },
  { code: 'GA', fr: 'Gabon', en: 'Gabon' },
  { code: 'GM', fr: 'Gambie', en: 'Gambia' },
  { code: 'GH', fr: 'Ghana', en: 'Ghana' },
  { code: 'GN', fr: 'Guinée', en: 'Guinea' },
  { code: 'GQ', fr: 'Guinée équatoriale', en: 'Equatorial Guinea' },
  { code: 'GW', fr: 'Guinée-Bissau', en: 'Guinea-Bissau' },
  { code: 'KE', fr: 'Kenya', en: 'Kenya' },
  { code: 'LS', fr: 'Lesotho', en: 'Lesotho' },
  { code: 'LR', fr: 'Libéria', en: 'Liberia' },
  { code: 'LY', fr: 'Libye', en: 'Libya' },
  { code: 'MG', fr: 'Madagascar', en: 'Madagascar' },
  { code: 'MW', fr: 'Malawi', en: 'Malawi' },
  { code: 'ML', fr: 'Mali', en: 'Mali' },
  { code: 'MA', fr: 'Maroc', en: 'Morocco' },
  { code: 'MU', fr: 'Maurice', en: 'Mauritius' },
  { code: 'MR', fr: 'Mauritanie', en: 'Mauritania' },
  { code: 'MZ', fr: 'Mozambique', en: 'Mozambique' },
  { code: 'NA', fr: 'Namibie', en: 'Namibia' },
  { code: 'NE', fr: 'Niger', en: 'Niger' },
  { code: 'NG', fr: 'Nigéria', en: 'Nigeria' },
  { code: 'UG', fr: 'Ouganda', en: 'Uganda' },
  { code: 'CF', fr: 'République centrafricaine', en: 'Central African Republic' },
  { code: 'RW', fr: 'Rwanda', en: 'Rwanda' },
  { code: 'EH', fr: 'Sahara occidental', en: 'Western Sahara' },
  { code: 'ST', fr: 'Sao Tomé-et-Principe', en: 'São Tomé and Príncipe' },
  { code: 'SN', fr: 'Sénégal', en: 'Senegal' },
  { code: 'SC', fr: 'Seychelles', en: 'Seychelles' },
  { code: 'SL', fr: 'Sierra Leone', en: 'Sierra Leone' },
  { code: 'SO', fr: 'Somalie', en: 'Somalia' },
  { code: 'SD', fr: 'Soudan', en: 'Sudan' },
  { code: 'SS', fr: 'Soudan du Sud', en: 'South Sudan' },
  { code: 'TZ', fr: 'Tanzanie', en: 'Tanzania' },
  { code: 'TD', fr: 'Tchad', en: 'Chad' },
  { code: 'TG', fr: 'Togo', en: 'Togo' },
  { code: 'TN', fr: 'Tunisie', en: 'Tunisia' },
  { code: 'ZM', fr: 'Zambie', en: 'Zambia' },
  { code: 'ZW', fr: 'Zimbabwe', en: 'Zimbabwe' },
] as const;

type PilotInquiryCountryCode = typeof pilotInquiryCountries[number]['code'];
export const pilotInquiryCountryCodes = pilotInquiryCountries.map(
  ({ code }) => code,
) as [PilotInquiryCountryCode, ...PilotInquiryCountryCode[]];

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).transform((value) => value || undefined).optional();

const noControlCharacters = (value: string) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value);

export const pilotInquirySubmissionSchema = z.object({
  kind: z.enum(pilotInquiryKinds),
  fullName: z.string().trim().min(2).max(120).refine(noControlCharacters),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: optionalText(30).refine(
    (value) => value === undefined || /^[+\d().\s-]{7,30}$/u.test(value),
    'Enter a valid phone number.',
  ),
  organizationName: z.string().trim().min(2).max(180).refine(noControlCharacters),
  organizationType: z.enum(pilotInquiryOrganizationTypes),
  roleTitle: optionalText(120).refine(
    (value) => value === undefined || (value.length >= 2 && noControlCharacters(value)),
  ),
  city: optionalText(100).refine(
    (value) => value === undefined || (value.length >= 2 && noControlCharacters(value)),
  ),
  countryCode: z.string().trim().transform((value) => value.toUpperCase())
    .pipe(z.enum(pilotInquiryCountryCodes)),
  participantEstimate: z.number().int().min(1).max(1_000_000).optional(),
  timeline: z.enum(pilotInquiryTimelines),
  message: z.string().trim().min(30).max(3000).refine(noControlCharacters),
  locale: z.enum(['fr', 'en']),
  source: z.enum(['contact', 'institutions', 'impact', 'footer', 'other']).default('contact'),
  campaign: optionalText(80).refine(
    (value) => value === undefined || /^[\p{L}\p{N} _.-]+$/u.test(value),
  ),
  consent: z.literal(true),
  website: z.string().trim().max(200).default(''),
}).strict().superRefine((input, context) => {
  const links = input.message.match(/(?:https?:\/\/|www\.)/giu)?.length ?? 0;
  if (links > 3) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['message'],
      message: 'Please limit the message to three links.',
    });
  }
});

export type PilotInquirySubmission = z.infer<typeof pilotInquirySubmissionSchema>;
export type PilotInquiryStatus = typeof pilotInquiryStatuses[number];

export function isLikelyAutomatedInquiry(input: Pick<PilotInquirySubmission, 'website'>) {
  return input.website.length > 0;
}
