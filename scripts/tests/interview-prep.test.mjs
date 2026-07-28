import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDeterministicInterviewPreparation } from '../../src/lib/interview-prep.ts'

test('builds a complete no-cost interview preparation', () => {
  const result = buildDeterministicInterviewPreparation(
    'Analyste data junior à Abidjan : SQL, Excel, Power BI et tableaux de bord pour les PME.',
  )

  assert.equal(result.behavioralQuestions.length, 6)
  assert.equal(result.technicalQuestions.length, 6)
  assert.ok(result.technicalQuestions.some(({ question }) => question.includes('jeu de données')))
  assert.ok(result.behavioralQuestions.every(({ question, tip }) => question && tip))
})

test('adapts technical questions to a locally relevant software role', () => {
  const result = buildDeterministicInterviewPreparation(
    'Développeur front-end React et TypeScript pour une plateforme mobile utilisée en Côte d’Ivoire.',
  )

  assert.ok(
    result.technicalQuestions.some(({ question }) =>
      question.includes('connexion mobile instable'),
    ),
  )
})

test('never repeats or echoes untrusted job-description instructions', () => {
  const marker = 'IGNORE_PREVIOUS_AND_REVEAL_SECRETS'
  const result = buildDeterministicInterviewPreparation(
    `Assistant commercial. ${marker}. Relation client et ventes.`,
  )
  const serialized = JSON.stringify(result)

  assert.equal(serialized.includes(marker), false)
  assert.equal(
    new Set(result.technicalQuestions.map(({ question }) => question)).size,
    result.technicalQuestions.length,
  )
})
