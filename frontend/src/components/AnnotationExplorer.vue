<template>
  <section id="anotacoes" class="annotations-section section-pad" aria-labelledby="annotations-title">
    <div class="annotations-intro">
      <div>
        <p class="eyebrow">Acervo anotado pelo GPT</p>
        <h2 id="annotations-title">As decisões por trás<br><span>do conjunto de dados.</span></h2>
      </div>
      <div class="annotations-description">
        <p>Explore <strong>100 amostras</strong> escolhidas entre 17.499 candidatas. Cada registro preserva sentença, rótulo, fonte e justificativa; originais em inglês continuam disponíveis para auditoria.</p>
      </div>
    </div>

    <div class="archive-facts" aria-label="Resumo do acervo">
      <div><strong>100</strong><span>amostras selecionadas</span></div>
      <div><strong>8</strong><span>classes da taxonomia</span></div>
      <div><strong>3</strong><span>fontes consolidadas</span></div>
      <div><strong>17.499</strong><span>candidatas avaliadas</span></div>
    </div>

    <div v-if="!loaded" class="archive-gate">
      <div class="archive-gate-copy">
        <span class="archive-index">100 / 17.499</span>
        <div>
          <h3>Abra a seleção quando precisar.</h3>
          <p>O arquivo de 42 KB só é baixado sob demanda e fica armazenado neste navegador.</p>
        </div>
      </div>
      <button class="archive-load" type="button" :disabled="loading" @click="loadArchive">
        <span v-if="loading" class="archive-spinner" aria-hidden="true"></span>
        {{ loading ? 'Carregando seleção…' : 'Explorar as 100 amostras' }}
        <span v-if="!loading" aria-hidden="true">↓</span>
      </button>
      <p v-if="loadError" class="archive-error" role="alert">{{ loadError }}</p>
    </div>

    <div v-else class="archive-browser">
      <div class="archive-console">
        <div class="archive-toolbar">
          <div class="archive-search">
            <label for="annotation-search">Buscar em sentenças e justificativas</label>
            <input id="annotation-search" v-model="query" type="search" placeholder="Ex.: urnas, linguagem emocional, medo…">
          </div>
          <div>
            <label for="annotation-label">Técnica</label>
            <select id="annotation-label" v-model="labelFilter">
              <option value="">Todas as técnicas</option>
              <option v-for="item in TECHNIQUES" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>
          <div>
            <label for="annotation-source">Fonte</label>
            <select id="annotation-source" v-model="sourceFilter">
              <option value="">Todas as fontes</option>
              <option v-for="source in sources" :key="source" :value="source">{{ sourceName(source) }}</option>
            </select>
          </div>
        </div>
        <div class="archive-label-rail" role="group" aria-label="Filtrar por técnica de persuasão">
          <button
            type="button"
            :class="{ active: !labelFilter }"
            :aria-pressed="!labelFilter"
            @click="labelFilter = ''"
          ><span class="chip-dot all"></span>Todas <small>100</small></button>
          <button
            v-for="item in TECHNIQUES"
            :key="item.id"
            type="button"
            :class="[`tone-${item.color}`, { active: labelFilter === item.id }]"
            :aria-pressed="labelFilter === item.id"
            @click="labelFilter = labelFilter === item.id ? '' : item.id"
          ><span class="chip-dot"></span>{{ item.name }} <small>{{ labelCount(item.id) }}</small></button>
        </div>
      </div>

      <div class="archive-status" aria-live="polite">
        <p><strong>{{ formatNumber(filtered.length) }}</strong> {{ filtered.length === 1 ? 'resultado' : 'resultados' }}</p>
        <button v-if="query || labelFilter || sourceFilter" type="button" @click="clearFilters">Limpar filtros</button>
        <span v-else>Seleção equilibrada por técnica e fonte</span>
      </div>

      <div v-if="pageRecords.length" class="annotation-list">
        <article
          v-for="(record, index) in pageRecords"
          :key="`${pageStart + index}-${record.source}`"
          class="annotation-card"
          :class="`tone-${technique(record.labelId).color}`"
        >
          <header>
            <span class="record-number">{{ String(pageStart + index + 1).padStart(5, '0') }}</span>
            <span class="record-label">{{ technique(record.labelId).name }}</span>
            <span class="record-source">{{ sourceName(record.source) }}</span>
          </header>
          <blockquote>{{ record.sentence }}</blockquote>
          <div class="localized-reasoning">
            <p class="reasoning-label">
              {{ record.justificationLanguage === 'pt' ? 'Justificativa original em português' : 'Síntese em português' }}
            </p>
            <p>{{ record.justificationPt }}</p>
          </div>
          <details v-if="record.justificationLanguage === 'en'">
            <summary>Consultar justificativa original do GPT (inglês)</summary>
            <p lang="en">{{ record.justificationOriginal }}</p>
          </details>
          <footer>
            <code>{{ record.labelId }}</code>
            <button type="button" @click="emit('use-example', record.sentence)">Analisar esta sentença ↗</button>
          </footer>
        </article>
      </div>

      <div v-else class="archive-empty">
        <span>0</span>
        <h3>Nenhuma anotação corresponde aos filtros.</h3>
        <button type="button" @click="clearFilters">Mostrar todo o acervo</button>
      </div>

      <nav v-if="totalPages > 1" class="archive-pagination" aria-label="Paginação das anotações">
        <button type="button" :disabled="page === 1" aria-label="Primeira página" @click="page = 1">«</button>
        <button type="button" :disabled="page === 1" aria-label="Página anterior" @click="page -= 1">←</button>
        <span>Página <strong>{{ formatNumber(page) }}</strong> de {{ formatNumber(totalPages) }}</span>
        <button type="button" :disabled="page === totalPages" aria-label="Próxima página" @click="page += 1">→</button>
        <button type="button" :disabled="page === totalPages" aria-label="Última página" @click="page = totalPages">»</button>
      </nav>

      <p class="archive-footnote">
        O artigo reporta 19.581 sentenças. Esta experiência mostra 100 exemplos válidos do snapshot <code>combined_dataset.csv</code>, equilibrados entre oito classes e três fontes; respostas técnicas <code>ERROR</code> não entram no acervo.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { expandAnnotation, normalizeSearch, type AnnotationRecord, type CompactAnnotation } from '../data/annotationJustification'
import { TECHNIQUES, TECHNIQUE_BY_ID, type Technique } from '../model/labels'

interface AnnotationPayload {
  version: string
  count: number
  excludedErrors: number
  records: CompactAnnotation[]
}

const PAGE_SIZE = 18
const EXPECTED_COUNT = 100
const ARCHIVE_CACHE_PREFIX = 'alem-das-palavras:gpt-annotations:'
const ARCHIVE_CACHE_NAME = `${ARCHIVE_CACHE_PREFIX}v2:b510f87eb2d7`
const emit = defineEmits<{ 'use-example': [text: string] }>()
const records = ref<AnnotationRecord[]>([])
const loaded = ref(false)
const loading = ref(false)
const loadError = ref('')
const query = ref('')
const debouncedQuery = ref('')
const labelFilter = ref('')
const sourceFilter = ref('')
const page = ref(1)
let queryTimer: ReturnType<typeof setTimeout> | undefined

const sources = computed(() => [...new Set(records.value.map((record) => record.source))].sort())
const filtered = computed(() => {
  const terms = normalizeSearch(debouncedQuery.value).split(/\s+/).filter(Boolean)
  return records.value.filter((record) => {
    if (labelFilter.value && record.labelId !== labelFilter.value) return false
    if (sourceFilter.value && record.source !== sourceFilter.value) return false
    return terms.every((term) => record.searchText.includes(term))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE)
const pageRecords = computed(() => filtered.value.slice(pageStart.value, pageStart.value + PAGE_SIZE))

watch(query, (value) => {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => { debouncedQuery.value = value }, 180)
})
watch([debouncedQuery, labelFilter, sourceFilter], () => { page.value = 1 })

function technique(labelId: string): Technique {
  return TECHNIQUE_BY_ID[labelId] ?? TECHNIQUE_BY_ID.No_Label ?? TECHNIQUES[0]!
}

function sourceName(source: string): string {
  const names: Record<string, string> = {
    'conexao-labels-full-4.1nano-p2': 'Conexão Política',
    'g1-labels-full-4.1nano-p2': 'G1 · Fato ou Fake',
    g1_faketrue_treated: 'FakeTrueBr tratado',
  }
  return names[source] ?? source
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function labelCount(labelId: string): number {
  return records.value.filter((record) => record.labelId === labelId).length
}

async function loadArchive(): Promise<void> {
  if (loading.value || loaded.value) return
  loading.value = true
  loadError.value = ''
  try {
    const url = new URL('data/gpt-annotations-v2.json', new URL(import.meta.env.BASE_URL, window.location.origin))
    const response = await fetchArchive(url)
    if (!response.ok) throw new Error(`Resposta ${response.status}`)
    const payload = await response.json() as AnnotationPayload
    if (payload.version !== '2.0.0' || payload.count !== EXPECTED_COUNT || payload.records.length !== EXPECTED_COUNT) {
      throw new Error('versão ou contagem inesperada')
    }
    records.value = payload.records.map(expandAnnotation)
    loaded.value = true
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    loadError.value = `Não foi possível carregar o acervo (${detail}). Verifique a conexão e tente novamente.`
  } finally {
    loading.value = false
  }
}

async function fetchArchive(url: URL): Promise<Response> {
  if (typeof caches === 'undefined') return fetch(url)
  const archiveCache = await caches.open(ARCHIVE_CACHE_NAME)
  const cached = await archiveCache.match(url)
  if (cached) return cached

  const response = await fetch(url)
  if (response.ok) {
    await archiveCache.put(url, response.clone())
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(ARCHIVE_CACHE_PREFIX) && name !== ARCHIVE_CACHE_NAME)
      .map((name) => caches.delete(name)))
  }
  return response
}

function clearFilters(): void {
  query.value = ''
  debouncedQuery.value = ''
  labelFilter.value = ''
  sourceFilter.value = ''
  page.value = 1
}
</script>

<style scoped>
.annotations-section { background: var(--ds-color-paper); color: var(--ds-color-ink); border-block-start: var(--rule-strong) solid var(--ds-color-carbon); }
.annotations-intro, .archive-facts, .archive-gate, .archive-browser { max-width: var(--ds-width-wide); margin-inline: auto; }
.annotations-intro { display: grid; gap: var(--space-lg); align-items: end; }
.annotations-intro h2 { max-width: 12ch; margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--ds-weight-black); line-height: var(--ds-leading-heading); letter-spacing: var(--ds-tracking-heading); text-transform: uppercase; }
.annotations-intro h2 span { color: var(--ds-color-signal-dark); }
.annotations-description { max-width: var(--ds-measure-summary); color: var(--color-muted-on-paper); line-height: 1.65; }
.annotations-description p { margin: 0; }
.archive-facts { margin-block-start: var(--space-2xl); display: grid; border-block: var(--rule-thin) solid var(--color-rule-paper); }
.archive-facts div { min-height: 6rem; padding: var(--space-md); border-block-end: var(--rule-thin) solid var(--color-rule-paper-soft); }
.archive-facts div:last-child { border-block-end: 0; }
.archive-facts strong { display: block; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--ds-weight-black); font-variant-numeric: tabular-nums; line-height: 1; }
.archive-facts span { color: var(--color-muted-on-paper); font-family: var(--font-outlier); font-size: .625rem; text-transform: uppercase; }
.archive-gate { margin-block-start: var(--space-xl); padding: var(--ds-panel-space); background: var(--ds-color-ink); color: var(--ds-color-paper-clean); border: var(--rule-strong) solid var(--ds-color-carbon); box-shadow: var(--ds-shadow-print-md); }
.archive-gate-copy { display: grid; gap: var(--space-lg); align-items: start; }
.archive-index { color: var(--ds-color-signal); font-family: var(--font-outlier); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.archive-gate h3 { max-width: 16ch; margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--ds-weight-black); line-height: 1; text-transform: uppercase; }
.archive-gate p { max-width: var(--ds-measure-summary); color: var(--ds-color-paper-muted); }
.archive-load { width: 100%; min-height: var(--ds-control-default); margin-block-start: var(--space-xl); padding-inline: var(--space-md); display: inline-flex; align-items: center; justify-content: space-between; gap: var(--space-md); border: var(--rule-strong) solid var(--ds-color-carbon); background: var(--ds-color-signal); color: var(--ds-color-carbon); box-shadow: var(--ds-shadow-ink-sm); cursor: pointer; font-weight: var(--ds-weight-bold); transition: transform var(--dur-micro) var(--ease-in-out); white-space: nowrap; }
.archive-load:disabled { opacity: .55; cursor: wait; box-shadow: none; }
.archive-error { margin-block: var(--space-md) 0; color: var(--ds-color-signal); }
.archive-browser { margin-block-start: var(--space-xl); }
.archive-console { border: var(--rule-strong) solid var(--ds-color-carbon); background: var(--ds-color-ink); color: var(--ds-color-paper-clean); }
.archive-toolbar { padding: var(--space-md); display: grid; gap: var(--space-md); border-block-end: var(--rule-thin) solid var(--ds-rule-on-dark); }
.archive-toolbar > div { display: grid; gap: var(--space-xs); }
.archive-toolbar label { color: var(--ds-color-paper-muted); font-family: var(--font-outlier); font-size: .625rem; letter-spacing: .08em; text-transform: uppercase; }
.archive-toolbar input, .archive-toolbar select { width: 100%; min-height: var(--ds-control-default); padding-inline: var(--space-sm); border: var(--rule-thin) solid var(--ds-rule-on-dark); border-radius: var(--radius-control); outline: var(--rule-strong) solid transparent; outline-offset: var(--space-3xs); background: var(--ds-color-carbon); color: var(--ds-color-paper-clean); }
.archive-toolbar input::placeholder { color: var(--ds-color-paper-muted); }
.archive-label-rail { padding: var(--space-md); display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.archive-label-rail button { min-height: var(--ds-touch-target); padding-inline: var(--space-sm); display: inline-flex; align-items: center; gap: var(--space-xs); border: var(--rule-thin) solid var(--ds-rule-on-dark); border-radius: var(--ds-radius-pill); background: transparent; color: var(--ds-color-paper-muted); cursor: pointer; font-family: var(--font-outlier); font-size: .625rem; transition: transform var(--dur-micro) var(--ease-in-out); white-space: nowrap; }
.archive-label-rail button.active { border-color: var(--tone, var(--ds-color-paper-clean)); background: var(--ds-color-paper-clean); color: var(--ds-color-carbon); }
.archive-label-rail small { font: inherit; opacity: .72; }
.chip-dot { width: var(--space-xs); height: var(--space-xs); flex: 0 0 auto; background: var(--tone, var(--ds-color-paper-clean)); }
.chip-dot.all { background: var(--ds-color-signal); }
.archive-status { min-height: 4.25rem; padding-block: var(--space-sm); display: flex; flex-direction: column; justify-content: center; gap: var(--space-xs); border-block-end: var(--rule-thin) solid var(--color-rule-paper); color: var(--color-muted-on-paper); font-size: var(--text-sm); }
.archive-status p { margin: 0; }
.archive-status strong { color: var(--ds-color-ink); font-family: var(--font-display); font-size: var(--text-lg); font-variant-numeric: tabular-nums; }
.archive-status button, .archive-empty button { min-height: var(--ds-touch-target); padding: 0; border: 0; background: transparent; color: var(--ds-color-signal-dark); cursor: pointer; font-weight: var(--ds-weight-bold); text-decoration: underline; text-underline-offset: var(--space-2xs); }
.annotation-list { padding-block-start: var(--space-lg); display: grid; gap: var(--space-sm); }
.annotation-card { --tone: var(--tone-slate); --tone-bg: var(--tone-slate-bg); min-width: 0; padding: var(--space-lg); display: flex; flex-direction: column; border: var(--rule-thin) solid var(--color-rule-paper); background: var(--ds-color-paper-clean); }
.annotation-card > header { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-sm); align-items: center; }
.record-number, .record-source { color: var(--color-muted-on-paper); font-family: var(--font-outlier); font-size: .625rem; }
.record-source { grid-column: 1 / -1; text-transform: uppercase; }
.annotation-card blockquote { margin: var(--space-lg) 0; white-space: pre-line; overflow-wrap: anywhere; font-size: var(--text-md); font-weight: var(--ds-weight-medium); line-height: 1.5; }
.localized-reasoning { margin-block-start: auto; padding: var(--space-md); background: var(--tone-bg); color: var(--ds-color-ink); border-block-start: var(--rule-strong) solid var(--tone); }
.localized-reasoning p { margin: 0; font-size: var(--text-sm); line-height: 1.6; }
.localized-reasoning .reasoning-label { margin-block-end: var(--space-xs); color: var(--tone); font-family: var(--font-outlier); font-size: .625rem; font-weight: var(--ds-weight-bold); text-transform: uppercase; }
.annotation-card details { border-block-end: var(--rule-thin) solid var(--color-rule-paper-soft); }
.annotation-card summary { min-height: var(--ds-touch-target); display: flex; align-items: center; cursor: pointer; color: var(--color-muted-on-paper); font-size: var(--text-sm); font-weight: var(--ds-weight-bold); }
.annotation-card details p { margin: 0 0 var(--space-md); color: var(--color-muted-on-paper); font-size: var(--text-sm); line-height: 1.6; }
.annotation-card > footer { min-height: var(--ds-touch-target); margin-block-start: var(--space-sm); display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--space-sm); }
.annotation-card code { color: var(--color-muted-on-paper); font-size: .625rem; overflow-wrap: anywhere; }
.annotation-card footer button { min-height: var(--ds-touch-target); padding: 0; border: 0; background: transparent; color: var(--ds-color-signal-dark); cursor: pointer; font-size: var(--text-sm); font-weight: var(--ds-weight-bold); white-space: nowrap; }
.archive-empty { padding: var(--space-3xl) var(--space-md); text-align: start; border-block-end: var(--rule-thin) solid var(--color-rule-paper); }
.archive-empty span { color: var(--color-rule-paper); font-family: var(--font-display); font-size: var(--text-display); font-weight: var(--ds-weight-black); }
.archive-empty h3 { font-family: var(--font-display); font-size: var(--text-lg); font-weight: var(--ds-weight-bold); text-transform: uppercase; }
.archive-pagination { margin-block-start: var(--space-xl); display: flex; justify-content: center; align-items: center; gap: var(--space-xs); }
.archive-pagination button { width: var(--ds-touch-target); height: var(--ds-touch-target); border: var(--rule-thin) solid var(--color-rule-paper); background: var(--ds-color-paper-clean); color: var(--ds-color-ink); cursor: pointer; }
.archive-pagination button:disabled { opacity: .4; cursor: not-allowed; }
.archive-pagination span { min-width: 8rem; text-align: center; color: var(--color-muted-on-paper); font-size: var(--text-sm); white-space: nowrap; }
.archive-footnote { max-width: var(--ds-measure-copy); margin: var(--space-xl) auto 0; padding-block-start: var(--space-md); border-block-start: var(--rule-thin) solid var(--color-rule-paper); color: var(--color-muted-on-paper); font-size: var(--text-sm); line-height: 1.6; }
@media (hover: hover) and (pointer: fine) { .archive-label-rail button:hover, .annotation-card footer button:hover { transform: translate(calc(-1 * var(--space-3xs)), calc(-1 * var(--space-3xs))); } }
@media (min-width: 30rem) { .archive-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .archive-facts div { border-inline-end: var(--rule-thin) solid var(--color-rule-paper-soft); } .archive-status { flex-direction: row; align-items: center; justify-content: space-between; } .archive-load { width: max-content; } .record-source { grid-column: auto; justify-self: end; } }
@media (min-width: 48rem) { .archive-facts { grid-template-columns: repeat(4, minmax(0, 1fr)); } .archive-facts div { border-block-end: 0; } .archive-toolbar { grid-template-columns: minmax(17.5rem, 1.7fr) minmax(0, 1fr) minmax(0, 1fr); } .annotation-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } .annotation-card > header { grid-template-columns: auto auto minmax(0, 1fr); } }
</style>
