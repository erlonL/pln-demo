export interface DemoExample {
  id: string
  eyebrow: string
  title: string
  description: string
  text: string
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'contraste',
    eyebrow: 'Persuasivo + informativo',
    title: 'Contraste em duas sentenças',
    description: 'Compare uma formulação carregada com um registro factual curto.',
    text: 'Será que é preciso que você passe por isso para entender que bandido é lixo e deve ser extirpado da face da terra? A proposta foi apresentada na terça-feira.',
  },
  {
    id: 'medo',
    eyebrow: 'Caso do artigo',
    title: 'Urnas e ameaça',
    description: 'Um exemplo de linguagem de risco usado na discussão qualitativa da pesquisa.',
    text: 'Não vamos cair na esparrela, na armadilha que o pessoal está armando aí para fraudar as urnas. O período eleitoral começou oficialmente ontem.',
  },
  {
    id: 'editorial',
    eyebrow: 'Texto editorial',
    title: 'Várias marcas discursivas',
    description: 'Um pequeno parágrafo com intensificação, julgamento e descrição.',
    text: 'É um absurdo completo fingir que nada aconteceu. Os responsáveis repetem a mesma desculpa, repetem a mesma promessa e esperam que todos esqueçam. O relatório, porém, foi publicado com 42 páginas e três anexos.',
  },
  {
    id: 'limite',
    eyebrow: 'Caso-limite do artigo',
    title: 'Quando o neutro se confunde',
    description: 'A própria pesquisa relata que duração e continuidade política podem ser lidas como exagero.',
    text: 'Isso não significa que as negociações estejam concluídas e que Israel em breve obterá um novo governo que encerrará o reinado de 10 anos de Netanyahu.',
  },
]
