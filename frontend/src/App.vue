<template>
  <div class="site-shell ds-shell ds-grain">
    <header class="site-header">
      <div class="masthead-meta" aria-hidden="true">
        <span>Laboratório de leitura política</span>
        <span>UFPB · PLN · 2026</span>
      </div>
      <div class="masthead-main">
        <button class="icon-button" type="button" :aria-label="themeLabel" :title="themeLabel" @click="cycleTheme">
          <span aria-hidden="true">{{ themeIcon }}</span>
        </button>
        <a class="wordmark" href="#top" aria-label="Além das Palavras — início">
          <span>Além das Palavras</span>
        </a>
        <button class="guide-button" type="button" @click="tourOpen = true">Guia interativo</button>
      </div>
      <nav aria-label="Navegação principal">
        <a href="#detector">Detector</a>
        <a href="#taxonomia">Técnicas</a>
        <a href="#anotacoes">Anotações</a>
        <a href="#pesquisa">Pesquisa</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero" data-tour="intro">
        <div class="hero-copy">
          <p class="eyebrow"><span class="live-dot"></span> Modelo de pesquisa · executado localmente</p>
          <h1>Veja a persuasão<br><span>entre as linhas.</span></h1>
          <p class="hero-lede">Um BERT-Tiny treinado para reconhecer sete técnicas persuasivas em português — sentença por sentença, direto no seu navegador.</p>
          <div class="hero-actions">
            <a class="button primary" href="#detector">Analisar um texto <span aria-hidden="true">↓</span></a>
          </div>
          <ul class="trust-list" aria-label="Características principais">
            <li><span>01</span> Seu texto não é enviado</li>
            <li><span>02</span> 8 classes do artigo</li>
            <li><span>03</span> Modelo salvo após o 1º uso</li>
          </ul>
        </div>
        <div class="hero-visual" aria-label="Exemplo de sentenças anotadas">
          <p class="folio">SAÍDA ILUSTRATIVA / 001</p>
          <article class="paper-sample">
            <p class="sample-label">PALAVRAS FORTES · 94%</p>
            <p>“É um <mark class="mark-coral">absurdo completo</mark> fingir que nada aconteceu.”</p>
            <p class="sample-label neutral">NEUTRO · 91%</p>
            <p>“O relatório foi publicado <mark class="mark-slate">na terça-feira</mark>.”</p>
            <div class="paper-rule"></div>
            <small>O modelo aponta padrões. A interpretação continua humana.</small>
          </article>
        </div>
      </section>

      <section id="detector" class="detector-section section-pad">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Experimente o modelo</p>
            <h2>Do texto à técnica,<br>uma sentença por vez.</h2>
          </div>
          <p>Insira prosa em português. O navegador separa as sentenças, aplica o tokenizer original e executa o classificador localmente.</p>
        </div>

        <div class="workspace">
          <div class="editor-panel" data-tour="editor">
            <div class="panel-topline">
              <label for="analysis-text">Texto para análise</label>
              <button v-if="textInput" class="text-button" type="button" @click="clearText">Limpar</button>
            </div>
            <textarea
              id="analysis-text"
              v-model="textInput"
              :disabled="busy"
              :aria-invalid="Boolean(error)"
              :aria-describedby="error ? 'analysis-error' : 'analysis-help'"
              maxlength="50000"
              placeholder="Cole aqui uma notícia, artigo de opinião ou qualquer texto em português…"
              @input="error = ''"
            ></textarea>
            <div id="analysis-help" class="editor-meta" data-tour="segmentation">
              <span>{{ textInput.length.toLocaleString('pt-BR') }} / 50.000 caracteres</span>
              <span>{{ sentencePreview.length }} {{ sentencePreview.length === 1 ? 'sentença' : 'sentenças' }}</span>
            </div>

            <div class="examples" data-tour="examples">
              <span>Carregar exemplo</span>
              <div class="example-list">
                <button v-for="example in DEMO_EXAMPLES" :key="example.id" type="button" :title="example.description" @click="loadExample(example.text)">
                  <small>{{ example.eyebrow }}</small>{{ example.title }}
                </button>
              </div>
            </div>
          </div>

          <aside class="model-panel" data-tour="model" aria-labelledby="model-title">
            <div class="model-heading">
              <div class="model-icon" aria-hidden="true"><span></span><span></span><span></span></div>
              <div>
                <p class="eyebrow">Modelo de persuasão</p>
                <h3 id="model-title">BERT-Tiny PT-BR</h3>
              </div>
              <span class="status-pill" :class="modelStatus.stage"><i></i>{{ statusShort }}</span>
            </div>
            <dl class="model-facts">
              <div><dt>Download</dt><dd>18,3 MB</dd></div>
              <div><dt>Execução</dt><dd>{{ runtimeLabel }}</dd></div>
              <div><dt>Armazenamento</dt><dd>{{ cacheLabel }}</dd></div>
            </dl>
            <div class="privacy-note" data-tour="privacy">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4.5 5v5.8c0 4.8 3.1 9.3 7.5 10.7 4.4-1.4 7.5-5.9 7.5-10.7V5L12 2Zm0 4.2 4.2 1.7v2.9c0 3.2-1.8 6.3-4.2 7.5-2.4-1.2-4.2-4.3-4.2-7.5V7.9L12 6.2Z"/></svg>
              <p><strong>Processamento neste dispositivo.</strong> O texto não precisa sair do navegador para ser classificado.</p>
            </div>
            <div v-if="showProgress" class="model-progress" aria-live="polite">
              <div><span>{{ modelStatus.message }}</span><strong>{{ Math.round(modelStatus.progress) }}%</strong></div>
              <progress :value="modelStatus.progress" max="100">{{ modelStatus.progress }}%</progress>
            </div>
            <button class="model-settings-link" type="button" @click="openSettings">Ver armazenamento e versão →</button>
          </aside>
        </div>

        <div v-if="error" id="analysis-error" class="error-banner" role="alert"><strong>Não foi possível analisar.</strong> {{ error }}</div>
        <div class="analyze-row" data-tour="analyze">
          <button class="analyze-button" type="button" :disabled="busy || !textInput.trim()" @click="runAnalysis">
            <span v-if="busy" class="spinner" aria-hidden="true"></span>
            <span>{{ analyzeButtonLabel }}</span>
            <svg v-if="!busy" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
          </button>
          <p v-if="!modelStatus.cached && modelStatus.stage === 'idle'">Ao continuar, o modelo será baixado uma vez e armazenado neste navegador.</p>
          <p v-else-if="modelStatus.cached">O modelo já está armazenado. Nenhum novo download completo é necessário.</p>
        </div>

        <div v-if="!results.length" class="results-placeholder" data-tour="results-placeholder">
          <div class="placeholder-index">01</div>
          <p>Os resultados aparecerão aqui: texto anotado, análise de sentenças e distribuição das técnicas.</p>
          <div class="placeholder-lines" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>

        <section v-else ref="resultsSection" class="results" aria-labelledby="results-title">
          <div class="results-heading">
            <div><p class="eyebrow">Leitura concluída</p><h2 id="results-title">O que o modelo encontrou</h2></div>
            <div class="result-kpis">
              <span><strong>{{ results.length }}</strong> sentenças</span>
              <span><strong>{{ persuasiveCount }}</strong> persuasivas</span>
              <span><strong>{{ neutralCount }}</strong> neutras</span>
            </div>
          </div>

          <div class="view-tabs" role="tablist" aria-label="Visualização dos resultados">
            <button
              v-for="(tab, index) in tabs"
              :id="`tab-${tab.id}`"
              :key="tab.id"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`panel-${tab.id}`"
              :tabindex="activeTab === tab.id ? 0 : -1"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
              @keydown="onTabKeydown($event, index)"
            >{{ tab.label }}</button>
          </div>

          <div v-if="activeTab === 'annotated'" id="panel-annotated" class="annotated-layout" role="tabpanel" aria-labelledby="tab-annotated">
            <article class="annotated-paper">
              <p v-for="(paragraph, paragraphIndex) in groupedResults" :key="paragraphIndex">
                <button
                  v-for="(result, sentenceIndex) in paragraph" :key="`${result.start}-${sentenceIndex}`"
                  type="button" class="annotated-sentence" :class="`tone-${technique(result.labelId).color}`"
                  :aria-label="`${result.text} — ${technique(result.labelId).name}`"
                  :data-active="selectedResult === result" @click="selectedResult = result"
                >{{ result.text }}</button>
              </p>
            </article>
            <aside v-if="selectedResult" class="prediction-detail" :class="`tone-${technique(selectedResult.labelId).color}`">
              <p class="eyebrow">Previsão do modelo</p>
              <h3>{{ technique(selectedResult.labelId).name }}</h3>
              <p class="canonical-id">{{ selectedResult.labelId }}</p>
              <div class="probability"><strong>{{ percent(selectedResult.probability) }}</strong><span>probabilidade<br>não calibrada</span></div>
              <p>{{ technique(selectedResult.labelId).definition }}</p>
              <div v-if="selectedResult.truncated" class="truncation-warning">A sentença tinha {{ selectedResult.tokenCount }} tokens. Apenas os primeiros 512 foram avaliados.</div>
              <details>
                <summary>Outras possibilidades</summary>
                <ul><li v-for="alternative in selectedResult.alternatives" :key="alternative.labelId"><span>{{ technique(alternative.labelId).name }}</span><strong>{{ percent(alternative.probability) }}</strong></li></ul>
              </details>
              <small>{{ technique(selectedResult.labelId).caution }}</small>
            </aside>
          </div>

          <div v-else-if="activeTab === 'sentences'" id="panel-sentences" class="sentence-list" role="tabpanel" aria-labelledby="tab-sentences">
            <details v-for="(result, index) in results" :key="result.start" class="sentence-card" :class="`tone-${technique(result.labelId).color}`" :open="index === 0">
              <summary>
                <span class="sentence-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="sentence-copy">{{ result.text }}</span>
                <span class="label-chip">{{ technique(result.labelId).name }}</span>
                <strong>{{ percent(result.probability) }}</strong>
              </summary>
              <div class="sentence-expanded">
                <p><b>O rótulo significa:</b> {{ technique(result.labelId).definition }}</p>
                <p><b>Leia com cautela:</b> {{ technique(result.labelId).caution }}</p>
                <p v-if="result.truncated" class="truncation-warning">Foram avaliados 512 de {{ result.tokenCount }} tokens.</p>
              </div>
            </details>
          </div>

          <div v-else id="panel-summary" class="summary-panel" role="tabpanel" aria-labelledby="tab-summary">
            <div class="summary-lede">
              <p class="eyebrow">Distribuição no documento</p>
              <h3>{{ dominantTechnique ? technique(dominantTechnique.labelId).name : 'Nenhuma técnica persuasiva' }}</h3>
              <p>{{ dominantTechnique ? 'foi a técnica persuasiva mais frequente nesta análise.' : 'Todas as sentenças receberam a classe neutra.' }}</p>
            </div>
            <div class="distribution">
              <div v-for="item in summary" :key="item.labelId" class="distribution-row">
                <span class="swatch" :class="`tone-${technique(item.labelId).color}`"></span>
                <span>{{ technique(item.labelId).name }}</span>
                <div class="distribution-track"><i :class="`tone-${technique(item.labelId).color}`" :style="{ width: `${item.percentage}%` }"></i></div>
                <strong>{{ item.count }}</strong><small>{{ item.percentage.toFixed(0) }}%</small>
              </div>
            </div>
            <p class="summary-caution">Esta contagem resume as classes das sentenças. Ela não mede intenção, veracidade, viés global ou efeito psicológico do documento.</p>
          </div>
        </section>
      </section>

      <section id="taxonomia" class="taxonomy-section section-pad" data-tour="taxonomy">
        <div class="section-heading inverted">
          <div><p class="eyebrow">Taxonomia do modelo</p><h2>Oito maneiras de<br>ler uma sentença.</h2></div>
          <p>Sete técnicas derivadas da SemEval23-T3 e uma classe neutra. Os nomes em português seguem as traduções descritas no artigo.</p>
        </div>
        <div class="taxonomy-grid">
          <details v-for="(item, index) in TECHNIQUES" :key="item.id" :class="`tone-${item.color}`">
            <summary><span>{{ String(index).padStart(2, '0') }}</span><h3>{{ item.name }}</h3><i></i></summary>
            <p>{{ item.definition }}</p>
            <small>Rótulo no modelo: <code>{{ item.id }}</code></small>
          </details>
        </div>
      </section>

      <AnnotationExplorer @use-example="loadAnnotationExample" />

      <section id="pesquisa" class="research-section section-pad" data-tour="research">
        <div class="research-intro">
          <p class="eyebrow">Sobre a pesquisa</p>
          <h2>Uma baseline compacta<br>para o português.</h2>
          <p>“Além das Palavras” investiga a identificação automática de técnicas persuasivas em notícias e artigos de opinião. O estudo reuniu 19.581 sentenças e ajustou um BERT-Tiny sob restrições de hardware.</p>
          <a class="inline-link" href="https://github.com/kamilyassis/pln" target="_blank" rel="noreferrer">Explorar repositório da pesquisa ↗</a>
        </div>
        <div class="metric-card"><span class="metric-number">86<sup>%</sup></span><p>Acurácia reportada no conjunto de teste pelo artigo.</p><small>Resultado preliminar; não representa calibração das probabilidades.</small></div>
        <div class="architecture-card">
          <p class="eyebrow">Arquitetura demonstrada</p>
          <div class="architecture-flow"><span>Sentença</span><i>→</i><span>WordPiece</span><i>→</i><span>BERT-Tiny</span><i>→</i><span>8 logits</span></div>
          <dl><div><dt>Camadas</dt><dd>2</dd></div><div><dt>Dimensão</dt><dd>128</dd></div><div><dt>Cabeças</dt><dd>2</dd></div><div><dt>Limite</dt><dd>512 tokens</dd></div></dl>
        </div>
        <div class="limitations-card">
          <p class="eyebrow">Limitações importantes</p>
          <ul>
            <li>As anotações foram produzidas por GPT-4.1-nano e ainda precisam de validação humana sistemática.</li>
            <li>Neutro e palavras fortes tiveram os menores F1 no artigo: 0,57 e 0,60.</li>
            <li>Classes semanticamente próximas se confundem; a sentença isolada perde contexto discursivo.</li>
            <li>O corpus se concentra em notícias, checagem e opinião política; outros domínios podem se comportar diferente.</li>
          </ul>
        </div>
      </section>

      <section class="closing-section">
        <p class="eyebrow">A pesquisa se torna tangível</p>
        <h2>Leia criticamente.<br><span>Inclusive o modelo.</span></h2>
        <a class="button light" href="#detector">Testar outro texto ↑</a>
      </section>
    </main>

    <footer>
      <p class="footer-statement">Ler também é desconfiar da ferramenta.</p>
      <div class="footer-meta">
        <a class="wordmark" href="#top"><span>Além das Palavras</span></a>
        <p>Demo experimental · UFPB · Processamento de Linguagem Natural</p>
        <div><a href="https://github.com/erlonL/pln-demo" target="_blank" rel="noreferrer">Código ↗</a><a href="https://huggingface.co/prajjwal1/bert-tiny" target="_blank" rel="noreferrer">Modelo-base ↗</a></div>
      </div>
    </footer>

    <dialog ref="settingsDialog" class="settings-dialog" @click="closeOnBackdrop">
      <div>
        <header><div><p class="eyebrow">Armazenamento local</p><h2>Modelo neste navegador</h2></div><button class="icon-button" aria-label="Fechar" @click="settingsDialog?.close()">×</button></header>
        <dl>
          <div><dt>Modelo</dt><dd>{{ MODEL_MANIFEST.displayName }}</dd></div>
          <div><dt>Versão</dt><dd>v{{ MODEL_MANIFEST.version }}</dd></div>
          <div><dt>Artefato</dt><dd><code>{{ MODEL_MANIFEST.artifacts[3].sha256.slice(0, 12) }}</code></dd></div>
          <div><dt>Espaço esperado</dt><dd>{{ formatBytes(MODEL_MANIFEST.totalBytes) }}</dd></div>
          <div><dt>Armazenado</dt><dd>{{ modelStatus.cached ? 'Sim' : 'Não' }}</dd></div>
          <div><dt>Execução ativa</dt><dd>{{ runtimeLabel }}</dd></div>
        </dl>
        <p>Limpar remove somente os arquivos persistentes deste modelo. O aplicativo continuará disponível, mas a próxima análise exigirá novo download.</p>
        <button class="button danger" type="button" :disabled="!modelStatus.cached || busy" @click="confirmClearCache">Limpar modelo armazenado</button>
      </div>
    </dialog>

    <GuidedTour v-model="tourOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AnnotationExplorer from './components/AnnotationExplorer.vue'
import GuidedTour from './components/GuidedTour.vue'
import { DEMO_EXAMPLES } from './data/examples'
import { TECHNIQUES, TECHNIQUE_BY_ID, summarizeResults, type Technique } from './model/labels'
import { MODEL_MANIFEST, formatBytes } from './model/manifest'
import { segmentText, validateDocument } from './model/segmenter'
import type { AnalysisResult } from './model/types'
import { useModel } from './model/useModel'

type Theme = 'system' | 'light' | 'dark'
type ResultTab = 'annotated' | 'sentences' | 'summary'

const textInput = ref('')
const results = ref<AnalysisResult[]>([])
const selectedResult = ref<AnalysisResult | null>(null)
const error = ref('')
const activeTab = ref<ResultTab>('annotated')
const tourOpen = ref(false)
const resultsSection = ref<HTMLElement | null>(null)
const settingsDialog = ref<HTMLDialogElement | null>(null)
const theme = ref<Theme>((localStorage.getItem('theme') as Theme | null) ?? 'system')
const { modelStatus, inspectCache, prepareModel, analyze, clearCache } = useModel()

const tabs = [
  { id: 'annotated' as const, label: 'Texto anotado' },
  { id: 'sentences' as const, label: 'Sentenças' },
  { id: 'summary' as const, label: 'Resumo' },
]
const sentencePreview = computed(() => segmentText(textInput.value))
const busy = computed(() => ['checking', 'downloading', 'initializing', 'analyzing'].includes(modelStatus.value.stage))
const showProgress = computed(() => ['downloading', 'initializing', 'analyzing'].includes(modelStatus.value.stage))
const neutralCount = computed(() => results.value.filter((item) => item.labelId === 'No_Label').length)
const persuasiveCount = computed(() => results.value.length - neutralCount.value)
const summary = computed(() => summarizeResults(results.value))
const dominantTechnique = computed(() => summary.value.filter((item) => item.labelId !== 'No_Label').sort((a, b) => b.count - a.count)[0] ?? null)
const groupedResults = computed(() => {
  const groups = new Map<number, AnalysisResult[]>()
  for (const result of results.value) groups.set(result.paragraph, [...(groups.get(result.paragraph) ?? []), result])
  return [...groups.values()]
})
const analyzeButtonLabel = computed(() => {
  if (modelStatus.value.stage === 'analyzing') return modelStatus.value.message
  if (['downloading', 'initializing', 'checking'].includes(modelStatus.value.stage)) return modelStatus.value.message
  if (!modelStatus.value.cached && modelStatus.value.stage !== 'ready') return 'Baixar modelo e analisar'
  return results.value.length ? 'Analisar novamente' : 'Analisar texto'
})
const statusShort = computed(() => ({
  idle: 'Não baixado', checking: 'Verificando', cached: 'Armazenado', downloading: 'Baixando', initializing: 'Iniciando', ready: 'Pronto', analyzing: 'Analisando', error: 'Erro',
}[modelStatus.value.stage]))
const runtimeLabel = computed(() => modelStatus.value.device === 'webgpu' ? 'WebGPU' : modelStatus.value.device === 'wasm' ? 'WASM' : 'WebGPU → WASM')
const cacheLabel = computed(() => !modelStatus.value.persistent ? 'Somente nesta sessão' : modelStatus.value.cached ? 'Salvo localmente' : 'Após o primeiro uso')
const themeIcon = computed(() => theme.value === 'system' ? '◐' : theme.value === 'light' ? '☀' : '☾')
const themeLabel = computed(() => `Tema: ${theme.value === 'system' ? 'seguir sistema' : theme.value === 'light' ? 'claro' : 'escuro'}. Alterar tema.`)

function technique(id: string): Technique { return TECHNIQUE_BY_ID[id] ?? TECHNIQUES[0]! }
function percent(value: number): string { return `${Math.round(value * 100)}%` }
function onTabKeydown(event: KeyboardEvent, index: number) {
  const last = tabs.length - 1
  let nextIndex = index
  if (event.key === 'ArrowRight') nextIndex = index === last ? 0 : index + 1
  else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? last : index - 1
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = last
  else return

  event.preventDefault()
  const nextTab = tabs[nextIndex]
  if (!nextTab) return
  activeTab.value = nextTab.id
  document.getElementById(`tab-${nextTab.id}`)?.focus({ preventScroll: true })
}
function loadExample(text: string) { textInput.value = text; results.value = []; error.value = ''; document.querySelector<HTMLTextAreaElement>('#analysis-text')?.focus() }
async function loadAnnotationExample(text: string) {
  loadExample(text)
  await nextTick()
  document.querySelector('#detector')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
function clearText() { textInput.value = ''; results.value = []; error.value = '' }
function openSettings() { settingsDialog.value?.showModal() }
function closeOnBackdrop(event: MouseEvent) { if (event.target === settingsDialog.value) settingsDialog.value?.close() }

async function runAnalysis() {
  error.value = ''
  const sentences = sentencePreview.value
  const validation = validateDocument(textInput.value, sentences)
  if (validation) { error.value = validation; return }
  try {
    if (modelStatus.value.stage !== 'ready') await prepareModel()
    results.value = await analyze(sentences)
    selectedResult.value = results.value.find((item) => item.labelId !== 'No_Label') ?? results.value[0] ?? null
    activeTab.value = 'annotated'
    await nextTick()
    resultsSection.value?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Falha inesperada ao executar o modelo.'
  }
}

async function confirmClearCache() {
  if (!window.confirm('Remover os arquivos deste modelo armazenados neste navegador?')) return
  await clearCache()
  settingsDialog.value?.close()
}

function applyTheme() {
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('theme', theme.value)
  const themeColor = getComputedStyle(document.body).backgroundColor
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', themeColor)
}
function cycleTheme() {
  theme.value = theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system'
  applyTheme()
}

onMounted(async () => {
  applyTheme()
  try { await inspectCache() } catch { /* Cache is an enhancement; inference remains available. */ }
})
</script>
