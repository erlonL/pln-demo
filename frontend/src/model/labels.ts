export interface Technique {
  id: string
  name: string
  shortName: string
  definition: string
  caution: string
  color: string
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'No_Label',
    name: 'Neutro',
    shortName: 'Neutro',
    definition: 'Sentença predominantemente informativa ou descritiva, sem uma das sete técnicas persuasivas previstas pela taxonomia.',
    caution: 'Neutro não significa verdadeiro, imparcial ou livre de enquadramento editorial.',
    color: 'slate',
  },
  {
    id: 'Loaded_Language',
    name: 'Palavras fortes',
    shortName: 'Palavras fortes',
    definition: 'Uso de termos com forte carga emocional para influenciar a percepção do leitor.',
    caution: 'Palavras intensas também podem aparecer em descrições legítimas; contexto continua essencial.',
    color: 'coral',
  },
  {
    id: 'Name_Calling-Labeling',
    name: 'Imposição',
    shortName: 'Imposição',
    definition: 'Atribuição de rótulos ou julgamentos categóricos a uma pessoa, grupo ou ideia.',
    caution: 'A classe aproxima rotulação depreciativa e julgamento categórico conforme a anotação usada no estudo.',
    color: 'red',
  },
  {
    id: 'Doubt',
    name: 'Descredibilidade',
    shortName: 'Descredibilidade',
    definition: 'Questionamento da credibilidade de pessoas, instituições, informações ou fontes.',
    caution: 'Questionar uma fonte pode ser jornalisticamente necessário; a previsão descreve forma discursiva, não intenção.',
    color: 'amber',
  },
  {
    id: 'Repetition',
    name: 'Repetição',
    shortName: 'Repetição',
    definition: 'Recorrência de termos ou ideias para reforçar uma mensagem.',
    caution: 'Como o modelo recebe sentenças isoladas, repetições entre sentenças podem não ser percebidas.',
    color: 'blue',
  },
  {
    id: 'Appeal_to_Fear-Prejudice',
    name: 'Apelo ao medo',
    shortName: 'Apelo ao medo',
    definition: 'Uso de ameaças, riscos ou preconceitos para provocar medo e orientar uma conclusão.',
    caution: 'A presença de um risco real não prova que exista manipulação intencional.',
    color: 'plum',
  },
  {
    id: 'Flag_Waving',
    name: 'Apelo patriótico',
    shortName: 'Apelo patriótico',
    definition: 'Mobilização de identidade nacional ou coletiva para sustentar uma posição.',
    caution: 'Referências políticas e eleitorais podem ser confundidas com identidade coletiva pelo modelo.',
    color: 'green',
  },
  {
    id: 'Exaggeration-Minimisation',
    name: 'Exagero ou minimização',
    shortName: 'Exagero',
    definition: 'Amplificação ou redução da gravidade, escala ou importância de um fato.',
    caution: 'Números, duração e comparações podem ativar esta classe mesmo em trechos informativos.',
    color: 'violet',
  },
]

export const TECHNIQUE_BY_ID = Object.fromEntries(TECHNIQUES.map((item) => [item.id, item])) as Record<string, Technique>

export interface TechniqueCount {
  labelId: string
  count: number
  percentage: number
}

export function summarizeResults(results: Array<{ labelId: string }>): TechniqueCount[] {
  const counts = new Map<string, number>()
  for (const result of results) counts.set(result.labelId, (counts.get(result.labelId) ?? 0) + 1)
  return TECHNIQUES.map((technique) => ({
    labelId: technique.id,
    count: counts.get(technique.id) ?? 0,
    percentage: results.length ? ((counts.get(technique.id) ?? 0) / results.length) * 100 : 0,
  })).filter((item) => item.count > 0)
}
