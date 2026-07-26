import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  isLikelyAutomatedInquiry,
  pilotInquiryCountries,
  pilotInquiryCountryCodes,
  pilotInquirySubmissionSchema,
} from '../../src/lib/pilot-inquiries.ts'

const validInquiry = {
  kind: 'pilot',
  fullName: 'Aya Nguessan',
  email: 'AYA@EXAMPLE.CI',
  phone: '+225 07 00 00 00 00',
  organizationName: 'Programme Emploi Jeunes',
  organizationType: 'public_institution',
  roleTitle: 'Coordinatrice',
  city: 'Abidjan',
  countryCode: 'ci',
  participantEstimate: 250,
  timeline: 'three_months',
  message: 'Nous souhaitons suivre le passage de la formation au premier emploi.',
  locale: 'fr',
  source: 'institutions',
  campaign: 'pilote_abidjan_2026',
  consent: true,
  website: '',
}

test('pilot inquiry validation normalizes contact and country identifiers', () => {
  const parsed = pilotInquirySubmissionSchema.parse(validInquiry)
  assert.equal(parsed.email, 'aya@example.ci')
  assert.equal(parsed.countryCode, 'CI')
  assert.equal(parsed.participantEstimate, 250)
})

test('pilot inquiry validation rejects undisclosed fields and missing consent', () => {
  assert.equal(pilotInquirySubmissionSchema.safeParse({
    ...validInquiry,
    password: 'must-never-be-collected',
  }).success, false)
  assert.equal(pilotInquirySubmissionSchema.safeParse({
    ...validInquiry,
    consent: false,
  }).success, false)
})

test('pilot inquiry validation bounds contact data and promotional links', () => {
  assert.equal(pilotInquirySubmissionSchema.safeParse({
    ...validInquiry,
    participantEstimate: 1_000_001,
  }).success, false)
  assert.equal(pilotInquirySubmissionSchema.safeParse({
    ...validInquiry,
    message: 'See https://one.example https://two.example https://three.example https://four.example for details.',
  }).success, false)
  assert.equal(pilotInquirySubmissionSchema.safeParse({
    ...validInquiry,
    countryCode: 'AF',
  }).success, false)
})

test('pilot inquiry markets cover Africa with ISO codes aligned to the database', async () => {
  assert.equal(pilotInquiryCountries.length, 55)
  assert.equal(new Set(pilotInquiryCountryCodes).size, pilotInquiryCountryCodes.length)
  for (const code of ['CI', 'CD', 'RW', 'UG', 'TZ', 'ET', 'EG', 'DZ', 'EH']) {
    assert.equal(pilotInquiryCountryCodes.includes(code), true, code)
  }
  assert.equal(pilotInquiryCountryCodes.includes('AF'), false)

  const migration = await readFile(
    new URL('../../db/migrations/007_pilot_inquiries.sql', import.meta.url),
    'utf8',
  )
  const countryConstraint = migration
    .slice(migration.indexOf('country_code text'), migration.indexOf('participant_estimate integer'))
  const migrationCodes = new Set(
    [...countryConstraint.matchAll(/'([A-Z]{2})'/g)].map((match) => match[1]),
  )
  assert.deepEqual(
    [...migrationCodes].sort(),
    [...pilotInquiryCountryCodes].sort(),
  )
})

test('honeypot content is classified as automated without affecting valid submissions', () => {
  assert.equal(isLikelyAutomatedInquiry({ website: '' }), false)
  assert.equal(isLikelyAutomatedInquiry({ website: 'https://spam.example' }), true)
})
