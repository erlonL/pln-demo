export type CompactAnnotation = [sentence: string, labelId: string, justification: string, source: string]

export interface AnnotationRecord {
  sentence: string
  labelId: string
  justificationOriginal: string
  justificationPt: string
  justificationLanguage: 'pt' | 'en'
  source: string
  searchText: string
}

const PORTUGUESE_SOURCES = new Set(['g1_faketrue_treated'])

const LOCAL_SUMMARIES: Record<string, string> = {
  No_Label: 'O GPT considerou o trecho predominantemente informativo ou descritivo e não identificou uma das sete técnicas persuasivas da taxonomia.',
  Loaded_Language: 'O GPT identificou termos com carga emocional usados para intensificar a mensagem e influenciar a percepção do leitor.',
  'Name_Calling-Labeling': 'O GPT identificou rotulação, julgamento categórico ou ataque dirigido a uma pessoa, grupo ou ideia.',
  Doubt: 'O GPT identificou uma formulação que questiona a credibilidade de uma pessoa, instituição, fonte ou informação.',
  Repetition: 'O GPT identificou repetição de palavras ou ideias como recurso para reforçar a mensagem.',
  'Appeal_to_Fear-Prejudice': 'O GPT identificou o uso de ameaça, risco, medo ou preconceito para orientar a interpretação do leitor.',
  Flag_Waving: 'O GPT identificou um apelo à identidade nacional ou coletiva para fortalecer uma posição.',
  'Exaggeration-Minimisation': 'O GPT identificou amplificação ou redução da escala, gravidade ou importância do que é descrito.',
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function quotedCues(justification: string): string[] {
  const cues: string[] = []
  const pattern = /["'“‘]([^"'”’\n]{1,72})["'”’]/g
  for (const match of justification.matchAll(pattern)) {
    const cue = match[1]?.trim()
    if (cue && !cues.some((item) => normalizeSearch(item) === normalizeSearch(cue))) cues.push(cue)
    if (cues.length === 5) break
  }
  return cues
}

export function localizedJustification(labelId: string, original: string, source: string): {
  text: string
  language: 'pt' | 'en'
} {
  if (PORTUGUESE_SOURCES.has(source)) return { text: original, language: 'pt' }
  const summary = LOCAL_SUMMARIES[labelId] ?? 'O GPT associou o trecho a este rótulo da taxonomia.'
  const cues = quotedCues(original)
  if (!cues.length) return { text: summary, language: 'en' }
  const formatted = cues.map((cue) => `“${cue}”`).join(', ')
  return { text: `${summary} A justificativa original destacou ${formatted}.`, language: 'en' }
}

export function expandAnnotation(record: CompactAnnotation): AnnotationRecord {
  const [sentence, labelId, justificationOriginal, source] = record
  const localized = localizedJustification(labelId, justificationOriginal, source)
  return {
    sentence,
    labelId,
    justificationOriginal,
    justificationPt: localized.text,
    justificationLanguage: localized.language,
    source,
    searchText: normalizeSearch(`${sentence} ${localized.text} ${justificationOriginal}`),
  }
}
