import { describe, expect, it } from 'vitest'
import { MAX_CHARACTERS, fallbackSegments, segmentText, validateDocument } from './segmenter'

describe('segmentText', () => {
  it('preserves punctuation, ordering and paragraph indexes', () => {
    const text = 'A proposta foi publicada hoje. Isso é um absurdo!\n\nO debate continua? Sim.'
    const segments = segmentText(text)
    expect(segments.map((item) => item.text)).toEqual([
      'A proposta foi publicada hoje.',
      'Isso é um absurdo!',
      'O debate continua?',
      'Sim.',
    ])
    expect(segments.map((item) => item.paragraph)).toEqual([0, 0, 1, 1])
    expect(segments.map((item) => text.slice(item.start, item.end))).toEqual(segments.map((item) => item.text))
  })

  it('does not split common Portuguese abbreviations in the fallback', () => {
    const segments = fallbackSegments('O Dr. Silva apresentou o art. 5º. Depois, saiu.')
    expect(segments.map((item) => item.text)).toEqual(['O Dr. Silva apresentou o art. 5º.', 'Depois, saiu.'])
  })

  it('does not use a period-only split', () => {
    expect(segmentText('Pare agora! Você ouviu? Ótimo…').map((item) => item.text)).toHaveLength(3)
  })
})

describe('validateDocument', () => {
  it('rejects empty, oversized and over-segmented input', () => {
    expect(validateDocument('  ', [])).toContain('Insira')
    expect(validateDocument('a'.repeat(MAX_CHARACTERS + 1), [])).toContain('limite')
    const segments = Array.from({ length: 301 }, (_, index) => ({ text: 'a', start: index, end: index + 1, paragraph: 0 }))
    expect(validateDocument('a', segments)).toContain('300 sentenças')
  })
})
