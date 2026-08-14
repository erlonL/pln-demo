<template>
  <section id="anotacoes" class="annotations-section section-pad" aria-labelledby="annotations-title">
    <div class="annotations-intro">
      <div>
        <p class="eyebrow">Acervo anotado pelo GPT</p>
        <h2 id="annotations-title">As decisões por trás<br><em>do conjunto de dados.</em></h2>
      </div>
      <div class="annotations-description">
        <p>Explore uma curadoria de <strong>100 amostras anotadas</strong>, escolhidas entre 17.499 candidatas por qualidade, diversidade, técnica e fonte — com sentença, rótulo e justificativa.</p>
        <p>Quando a justificativa original está em inglês, apresentamos uma síntese em português baseada no rótulo e nos termos destacados. O texto original permanece disponível para auditoria.</p>
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
          <h3>Abra a seleção curada quando quiser explorar.</h3>
          <p>São apenas 42 KB antes da compressão, carregados sob demanda e armazenados localmente para visitas futuras. O corpus completo não é publicado nesta experiência.</p>
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
        O artigo reporta 19.581 sentenças no corpus de pesquisa. Para esta experiência pública, selecionamos 100 exemplos do snapshot <code>combined_dataset.csv</code> entre 17.499 anotações válidas. A seleção é equilibrada entre as oito classes, preserva as três fontes e exclui 203 respostas técnicas <code>ERROR</code>. O corpus completo não é distribuído pelo site.
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
.annotations-section { background: var(--paper-sunken); border-top: 1px solid var(--line); }
.annotations-intro { max-width: 1370px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(40px, 8vw, 120px); align-items: end; }
.annotations-intro h2 { margin: 0; font: 400 clamp(52px, 5.6vw, 84px)/.93 var(--serif); letter-spacing: -.05em; }
.annotations-intro h2 em { color: var(--accent); font-weight: 400; }
.annotations-description { max-width: 590px; color: var(--ink-soft); font-size: 15px; line-height: 1.75; }
.annotations-description p:last-child { margin-bottom: 0; padding-top: 15px; border-top: 1px solid var(--line); font-size: 12px; }
.archive-facts { max-width: 1370px; margin: 64px auto 0; display: grid; grid-template-columns: repeat(4, 1fr); border-block: 1px solid var(--line-dark); }
.archive-facts div { padding: 24px 28px; border-right: 1px solid var(--line); }
.archive-facts div:last-child { border-right: 0; }
.archive-facts strong { display: block; font: 400 37px var(--serif); }
.archive-facts span { color: var(--ink-faint); font: 9px var(--mono); text-transform: uppercase; }
.archive-gate { max-width: 1370px; margin: 46px auto 0; padding: clamp(26px, 5vw, 58px); position: relative; overflow: hidden; border: 1px solid #2a2a38; border-radius: 12px; background-color: #111118; background-image: radial-gradient(rgb(255 255 255 / 4%) 1px, transparent 1px); background-size: 4px 4px; color: #eeeef5; box-shadow: 0 24px 70px rgb(10 10 15 / 22%); }
.archive-gate-copy { display: grid; grid-template-columns: 130px 1fr; gap: 36px; align-items: start; }
.archive-index { color: var(--accent); font: 11px var(--mono); }
.archive-gate h3 { max-width: 720px; margin: 0; font: 400 clamp(30px, 3vw, 48px)/1.04 var(--serif); }
.archive-gate p { max-width: 720px; color: #aaaab7; line-height: 1.65; }
.archive-load { margin: 42px 0 0 166px; min-height: 52px; padding: 0 22px; display: inline-flex; align-items: center; gap: 22px; border: 0; background: var(--forest); color: #fff; cursor: pointer; font-weight: 700; }
.archive-load:disabled { opacity: .65; cursor: wait; }
.archive-spinner { width: 15px; height: 15px; border: 2px solid rgb(255 255 255 / 35%); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
.archive-error { margin-left: 166px; color: var(--red) !important; }
.archive-browser { max-width: 1370px; margin: 46px auto 0; }
.archive-console { overflow: hidden; border: 1px solid #2a2a38; border-radius: 12px; background-color: #0a0a0f; background-image: radial-gradient(rgb(255 255 255 / 3.5%) 1px, transparent 1px); background-size: 4px 4px; box-shadow: 0 22px 64px rgb(10 10 15 / 18%); }
.archive-toolbar { padding: 24px; display: grid; grid-template-columns: minmax(280px, 1.7fr) 1fr 1fr; gap: 16px; border-bottom: 1px solid #2a2a38; }
.archive-toolbar > div { display: grid; gap: 8px; }
.archive-toolbar label { color: #898995; font: 9px var(--mono); text-transform: uppercase; letter-spacing: .08em; }
.archive-toolbar input, .archive-toolbar select { width: 100%; min-height: 46px; padding: 0 13px; border: 1px solid #343442; border-radius: 6px; background: #16161e; color: #eeeef5; font: 12px var(--sans); }
.archive-toolbar input::placeholder { color: #737380; }
.archive-toolbar input:focus, .archive-toolbar select:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.archive-label-rail { padding: 13px 18px 17px; display: flex; flex-wrap: wrap; gap: 7px; }
.archive-label-rail button { min-height: 32px; padding: 0 10px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid #2a2a38; border-radius: 999px; background: #16161e; color: #b7b7c2; cursor: pointer; font: 9px var(--mono); transition: border-color .16s ease, background .16s ease, transform .16s ease; }
.archive-label-rail button:hover { border-color: #5a5a6a; transform: translateY(-1px); }
.archive-label-rail button.active { border-color: var(--tone, #7c6aff); background: color-mix(in srgb, var(--tone, #7c6aff) 18%, #16161e); color: #fff; }
.archive-label-rail small { color: #797986; font: inherit; }
.archive-label-rail button.active small { color: currentColor; opacity: .72; }
.chip-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--tone, #7c6aff); box-shadow: 0 0 8px color-mix(in srgb, var(--tone, #7c6aff) 55%, transparent); }
.chip-dot.all { background: #7c6aff; }
.archive-status { min-height: 68px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line-dark); color: var(--ink-faint); font-size: 11px; }
.archive-status p { margin: 0; }.archive-status strong { color: var(--ink); font: 400 24px var(--serif); }
.archive-status button, .archive-empty button { padding: 0; border: 0; background: transparent; color: var(--accent); cursor: pointer; font-weight: 700; }
.annotation-list { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding-top: 20px; }
.annotation-card { --tone: var(--slate); --tone-bg: var(--slate-bg); min-width: 0; padding: 25px; display: flex; flex-direction: column; border: 1px solid var(--line); border-left: 4px solid var(--tone); border-radius: 6px; background: var(--paper-raised); transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.annotation-card:hover { transform: translateX(3px); border-color: color-mix(in srgb, var(--tone) 45%, var(--line)); box-shadow: 0 12px 34px rgb(10 10 15 / 9%); }
.annotation-card > header { display: grid; grid-template-columns: auto auto 1fr; gap: 12px; align-items: center; }
.record-number { color: var(--ink-faint); font: 9px var(--mono); }.record-label { padding: 5px 8px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; background: var(--tone-bg); color: var(--tone); font-size: 10px; font-weight: 700; }.record-label::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }.record-source { justify-self: end; color: var(--ink-faint); font: 8px var(--mono); text-transform: uppercase; }
.annotation-card blockquote { margin: 26px 0; white-space: pre-line; overflow-wrap: anywhere; font: 400 20px/1.48 var(--serif); }
.localized-reasoning { margin-top: auto; padding: 18px; border-left: 3px solid var(--tone); background: var(--tone-bg); }
.localized-reasoning p { margin: 0; color: var(--ink-soft); font-size: 12px; line-height: 1.65; }
.localized-reasoning .reasoning-label { margin-bottom: 7px; color: var(--tone); font: 700 8px var(--mono); text-transform: uppercase; }
.annotation-card details { border-bottom: 1px solid var(--line); }.annotation-card summary { padding: 16px 0; cursor: pointer; color: var(--ink-soft); font-size: 10px; font-weight: 700; }.annotation-card details p { margin: 0 0 18px; color: var(--ink-faint); font-size: 11px; line-height: 1.65; }
.annotation-card > footer { min-height: 48px; margin-top: 12px; display: flex; align-items: end; justify-content: space-between; gap: 15px; }.annotation-card code { color: var(--ink-faint); font-size: 8px; }.annotation-card footer button { padding: 0; border: 0; background: transparent; color: var(--forest); cursor: pointer; font-size: 10px; font-weight: 700; }
.archive-empty { padding: 90px 20px; text-align: center; border-bottom: 1px solid var(--line-dark); }.archive-empty span { color: var(--line-dark); font: 400 72px var(--serif); }.archive-empty h3 { font: 400 28px var(--serif); }
.archive-pagination { margin-top: 32px; display: flex; justify-content: center; align-items: center; gap: 8px; }.archive-pagination button { width: 40px; height: 40px; border: 1px solid var(--line); background: var(--paper-raised); color: var(--ink); cursor: pointer; }.archive-pagination button:disabled { opacity: .35; cursor: default; }.archive-pagination span { min-width: 180px; text-align: center; color: var(--ink-soft); font-size: 11px; }
.archive-footnote { max-width: 850px; margin: 52px auto 0; padding-top: 20px; border-top: 1px solid var(--line); color: var(--ink-faint); text-align: center; font-size: 10px; line-height: 1.65; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) {
  .annotations-intro { grid-template-columns: 1fr; }.archive-facts { grid-template-columns: 1fr 1fr; }.archive-facts div:nth-child(2) { border-right: 0; }.archive-facts div:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
  .archive-toolbar { grid-template-columns: 1fr 1fr; }.archive-search { grid-column: 1 / -1; }.annotation-list { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .archive-facts { grid-template-columns: 1fr; }.archive-facts div { border-right: 0; border-bottom: 1px solid var(--line); }.archive-facts div:last-child { border-bottom: 0; }
  .archive-gate-copy { grid-template-columns: 1fr; gap: 18px; }.archive-load { width: 100%; margin: 30px 0 0; justify-content: space-between; }.archive-error { margin-left: 0; }
  .archive-toolbar { grid-template-columns: 1fr; }.archive-search { grid-column: auto; }.archive-status { align-items: start; flex-direction: column; justify-content: center; gap: 7px; }
  .annotation-card { padding: 18px; }.annotation-card > header { grid-template-columns: auto 1fr; }.record-source { grid-column: 1 / -1; justify-self: start; }.annotation-card blockquote { font-size: 18px; }
  .archive-pagination span { min-width: 130px; }.archive-pagination button:first-child, .archive-pagination button:last-child { display: none; }
}
</style>
