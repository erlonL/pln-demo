import { describe, expect, it } from 'vitest'
import { TECHNIQUES, TECHNIQUE_BY_ID, summarizeResults } from './labels'
import { MODEL_CACHE_NAME, MODEL_MANIFEST, formatBytes } from './manifest'

describe('research taxonomy', () => {
  it('keeps the exact eight checkpoint labels in index order', () => {
    expect(TECHNIQUES.map((item) => item.id)).toEqual([
      'No_Label', 'Loaded_Language', 'Name_Calling-Labeling', 'Doubt', 'Repetition',
      'Appeal_to_Fear-Prejudice', 'Flag_Waving', 'Exaggeration-Minimisation',
    ])
    expect(TECHNIQUE_BY_ID.No_Label?.name).toBe('Neutro')
  })

  it('summarizes only sentence-level predictions', () => {
    const summary = summarizeResults([{ labelId: 'No_Label' }, { labelId: 'Doubt' }, { labelId: 'Doubt' }])
    expect(summary.map(({ labelId, count }) => ({ labelId, count }))).toEqual([
      { labelId: 'No_Label', count: 1 },
      { labelId: 'Doubt', count: 2 },
    ])
    expect(summary[0]?.percentage).toBeCloseTo(100 / 3)
    expect(summary[1]?.percentage).toBeCloseTo(200 / 3)
  })
})

describe('model manifest', () => {
  it('has a deterministic cache identity and exact artifact total', () => {
    const total = MODEL_MANIFEST.artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0)
    expect(total).toBe(MODEL_MANIFEST.totalBytes)
    expect(MODEL_CACHE_NAME).toContain(MODEL_MANIFEST.version)
    expect(MODEL_CACHE_NAME).toContain(MODEL_MANIFEST.artifacts[3].sha256.slice(0, 12))
    expect(formatBytes(total)).toBe('18.3 MB')
  })
})
