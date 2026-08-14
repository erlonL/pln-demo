import type { SentenceSegment } from './types'

export const MAX_CHARACTERS = 50_000
export const MAX_SENTENCES = 300

const ABBREVIATIONS = new Set([
  'art.', 'av.', 'dr.', 'dra.', 'etc.', 'ex.', 'fig.', 'nº.', 'p.ex.', 'prof.', 'profa.', 'sr.', 'sra.', 'vs.',
])

function paragraphAt(text: string, index: number): number {
  const matches = text.slice(0, index).match(/\n\s*\n/g)
  return matches?.length ?? 0
}

function trimSegment(text: string, start: number, end: number): SentenceSegment | null {
  const raw = text.slice(start, end)
  const leading = raw.match(/^\s*/)?.[0].length ?? 0
  const trailing = raw.match(/\s*$/)?.[0].length ?? 0
  const cleanStart = start + leading
  const cleanEnd = Math.max(cleanStart, end - trailing)
  const sentence = text.slice(cleanStart, cleanEnd)
  if (!sentence) return null
  return { text: sentence, start: cleanStart, end: cleanEnd, paragraph: paragraphAt(text, cleanStart) }
}

export function fallbackSegments(text: string): SentenceSegment[] {
  const boundaries: number[] = []
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\n' && text[index + 1] === '\n') {
      boundaries.push(index)
      continue
    }
    if (!char || !'.!?…'.includes(char)) continue

    let cursor = index + 1
    while (cursor < text.length && `"'”’»)]}`.includes(text[cursor] ?? '')) cursor += 1
    if (cursor < text.length && !/\s/.test(text[cursor] ?? '')) continue

    const prefix = text.slice(Math.max(0, index - 12), index + 1).toLocaleLowerCase('pt-BR')
    const word = prefix.match(/[\p{L}º.]+\.$/u)?.[0]
    const isInitial = /\b\p{Lu}\.$/u.test(text.slice(Math.max(0, index - 3), index + 1))
    if ((word && ABBREVIATIONS.has(word)) || isInitial) continue
    boundaries.push(cursor)
  }

  const segments: SentenceSegment[] = []
  let start = 0
  for (const end of [...boundaries, text.length]) {
    const segment = trimSegment(text, start, end)
    if (segment) segments.push(segment)
    start = end
    while (start < text.length && /\s/.test(text[start] ?? '')) start += 1
  }
  return segments
}

export function segmentText(text: string): SentenceSegment[] {
  const normalized = text.replace(/\r\n?/g, '\n')
  if (!normalized.trim()) return []

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'sentence' })
    const result: SentenceSegment[] = []
    for (const part of segmenter.segment(normalized)) {
      const segment = trimSegment(normalized, part.index, part.index + part.segment.length)
      if (segment) result.push(segment)
    }
    return result
  }
  return fallbackSegments(normalized)
}

export function validateDocument(text: string, segments: SentenceSegment[]): string | null {
  if (!text.trim()) return 'Insira algum texto para analisar.'
  if (text.length > MAX_CHARACTERS) return `O limite é ${MAX_CHARACTERS.toLocaleString('pt-BR')} caracteres por análise.`
  if (segments.length > MAX_SENTENCES) return `O limite é ${MAX_SENTENCES} sentenças por análise; encontramos ${segments.length}.`
  return null
}
