import { describe, expect, it } from 'vitest'
import { expandAnnotation, localizedJustification, quotedCues } from './annotationJustification'

describe('localized GPT justifications', () => {
  it('preserves justifications that were originally written in Portuguese', () => {
    const original = "O texto utiliza a rotulação ao chamar Lula de 'luladrão'."
    expect(localizedJustification('Name_Calling-Labeling', original, 'g1_faketrue_treated')).toEqual({
      text: original,
      language: 'pt',
    })
  })

  it('creates a transparent Portuguese summary and retains highlighted cues', () => {
    const result = localizedJustification(
      'Loaded_Language',
      "The sentence uses emotionally charged words like 'caos' and 'tragédia' to influence perception.",
      'conexao-labels-full-4.1nano-p2',
    )
    expect(result.language).toBe('en')
    expect(result.text).toContain('O GPT identificou termos com carga emocional')
    expect(result.text).toContain('“caos”')
    expect(result.text).toContain('“tragédia”')
  })

  it('expands compact rows into searchable records without discarding the original', () => {
    const record = expandAnnotation(['Uma frase.', 'Doubt', 'The sentence raises doubt.', 'g1-labels-full-4.1nano-p2'])
    expect(record.justificationOriginal).toBe('The sentence raises doubt.')
    expect(record.searchText).toContain('uma frase')
    expect(quotedCues('No quoted terms here.')).toEqual([])
  })
})
