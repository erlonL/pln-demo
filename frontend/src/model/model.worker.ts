/// <reference lib="webworker" />

import { AutoModelForSequenceClassification, BertTokenizer, env } from '@huggingface/transformers'
import { ModelArtifactCache } from './cache'
import { MODEL_MANIFEST } from './manifest'
import type { AnalysisResult, ModelStatus, RuntimeDevice, SentenceSegment, WorkerRequest, WorkerResponse } from './types'

declare const self: DedicatedWorkerGlobalScope

const artifactCache = new ModelArtifactCache()
const baseUrl = new URL(import.meta.env.BASE_URL, self.location.origin).href
env.allowLocalModels = true
env.allowRemoteModels = false
env.localModelPath = new URL('models/', baseUrl).href
env.useBrowserCache = false
env.useCustomCache = artifactCache.available
env.customCache = artifactCache as any
env.cacheKey = artifactCache.cacheName
env.useWasmCache = false

let tokenizer: any = null
let model: any = null
let device: RuntimeDevice = null
let preparePromise: Promise<void> | null = null

function send(message: WorkerResponse) {
  self.postMessage(message)
}

function status(data: Partial<ModelStatus>): void {
  send({ type: 'status', status: data })
}

function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/memory|allocation|out of bounds/i.test(message)) return 'O navegador não conseguiu reservar memória para o modelo. Feche outras abas e tente novamente.'
  if (/fetch|network|failed to load/i.test(message)) return 'Não foi possível obter os arquivos do modelo. Verifique a conexão e tente novamente.'
  return `Não foi possível iniciar o modelo: ${message}`
}

function progressCallback(event: any): void {
  if (event.status === 'progress') {
    const progress = Number(event.progress_total ?? event.progress ?? 0)
    const loadedBytes = Number(event.loaded_total ?? event.loaded ?? 0)
    const totalBytes = Number(event.total_total ?? event.total ?? MODEL_MANIFEST.totalBytes)
    status({ stage: 'downloading', progress, loadedBytes, totalBytes, message: `Baixando ${event.file ?? 'modelo'}` })
  } else if (event.status === 'initiate') {
    status({ stage: 'downloading', message: `Preparando ${event.file ?? 'artefato'}` })
  }
}

async function loadForDevice(target: Exclude<RuntimeDevice, null>): Promise<void> {
  status({ stage: 'initializing', device: target, message: target === 'webgpu' ? 'Inicializando WebGPU' : 'Inicializando WebAssembly' })
  if (!tokenizer) {
    const reportTokenizerProgress = (progress: { loaded: number; total: number; progress: number }) => {
      status({
        stage: 'downloading',
        progress: progress.progress,
        loadedBytes: progress.loaded,
        totalBytes: MODEL_MANIFEST.totalBytes,
        message: 'Preparando tokenizer',
      })
    }
    const [tokenizerJson, tokenizerConfig] = await Promise.all([
      artifactCache.fetchArtifact(baseUrl, 'tokenizer.json', reportTokenizerProgress).then((response) => response.json()),
      artifactCache.fetchArtifact(baseUrl, 'tokenizer_config.json', reportTokenizerProgress).then((response) => response.json()),
    ])
    tokenizer = new BertTokenizer(tokenizerJson, tokenizerConfig)
  }
  model = await AutoModelForSequenceClassification.from_pretrained(MODEL_MANIFEST.id, {
    dtype: 'fp32',
    device: target,
    progress_callback: progressCallback,
  })
  device = target
}

async function hasWebGpuAdapter(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    return Boolean(gpu && await gpu.requestAdapter())
  } catch {
    return false
  }
}

async function prepare(): Promise<void> {
  if (model && tokenizer) return
  if (preparePromise) return preparePromise
  preparePromise = (async () => {
    const cacheState = await artifactCache.inspect(baseUrl)
    status({
      stage: cacheState.cached ? 'cached' : 'downloading',
      cached: cacheState.cached,
      persistent: cacheState.persistent,
      totalBytes: MODEL_MANIFEST.totalBytes,
      message: cacheState.cached ? 'Carregando modelo salvo neste navegador' : 'Preparando download do modelo',
    })

    if (typeof WebAssembly === 'undefined') throw new Error('Este navegador não oferece suporte a WebAssembly.')
    if (await hasWebGpuAdapter()) {
      try {
        await loadForDevice('webgpu')
      } catch (webGpuError) {
        model?.dispose?.()
        model = null
        status({ stage: 'initializing', device: 'wasm', message: 'WebGPU indisponível para este modelo; usando WebAssembly' })
        await loadForDevice('wasm')
        console.info('WebGPU fallback:', webGpuError)
      }
    } else {
      await loadForDevice('wasm')
    }
    await artifactCache.cleanupObsolete()
    const finalCache = await artifactCache.inspect(baseUrl)
    status({
      stage: 'ready', progress: 100, loadedBytes: MODEL_MANIFEST.totalBytes, totalBytes: MODEL_MANIFEST.totalBytes,
      cached: finalCache.cached, persistent: finalCache.persistent, device, message: 'Modelo pronto',
    })
  })().catch((error) => {
    preparePromise = null
    throw error
  })
  return preparePromise
}

function softmax(values: number[]): number[] {
  const maximum = Math.max(...values)
  const exps = values.map((value) => Math.exp(value - maximum))
  const total = exps.reduce((sum, value) => sum + value, 0)
  return exps.map((value) => value / total)
}

async function analyze(sentences: SentenceSegment[]): Promise<AnalysisResult[]> {
  await prepare()
  status({ stage: 'analyzing', progress: 0, message: 'Tokenizando sentenças' })

  const tokenCounts: number[] = []
  for (const sentence of sentences) {
    const encoded = await tokenizer(sentence.text, { truncation: false, padding: false })
    tokenCounts.push(Number(encoded.input_ids.dims.at(-1) ?? 0))
  }

  const results: AnalysisResult[] = []
  const batchSize = device === 'webgpu' ? 16 : 8
  for (let start = 0; start < sentences.length; start += batchSize) {
    const batch = sentences.slice(start, start + batchSize)
    const inputs = await tokenizer(batch.map((sentence) => sentence.text), {
      padding: true,
      truncation: true,
      max_length: MODEL_MANIFEST.maxTokens,
    })
    const output = await model(inputs)
    const logits = Array.from(output.logits.data as Float32Array, Number)
    const width = Number(output.logits.dims.at(-1) ?? 8)
    const maskData = Array.from(inputs.attention_mask.data as BigInt64Array | Int32Array, Number)
    const sequenceWidth = Number(inputs.attention_mask.dims.at(-1) ?? 0)

    for (let index = 0; index < batch.length; index += 1) {
      const row = logits.slice(index * width, (index + 1) * width)
      const probabilities = softmax(row)
      const ranked = probabilities.map((probability, labelIndex) => ({
        labelId: String((model.config.id2label as Record<string, string>)[String(labelIndex)]),
        probability,
      })).sort((a, b) => b.probability - a.probability)
      const top = ranked[0]
      const sentence = batch[index]
      if (!top || !sentence) continue
      const tokenCount = tokenCounts[start + index] ?? 0
      const tokensUsed = maskData.slice(index * sequenceWidth, (index + 1) * sequenceWidth).reduce((sum, value) => sum + value, 0)
      results.push({
        ...sentence,
        labelId: top.labelId,
        probability: top.probability,
        alternatives: ranked.slice(1, 3),
        tokenCount,
        tokensUsed,
        truncated: tokenCount > MODEL_MANIFEST.maxTokens,
      })
    }
    status({ stage: 'analyzing', progress: Math.round((results.length / sentences.length) * 100), message: `Analisando ${results.length} de ${sentences.length} sentenças` })
  }
  status({ stage: 'ready', progress: 100, device, message: 'Análise concluída' })
  return results
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  try {
    if (request.type === 'inspect-cache') {
      const cache = await artifactCache.inspect(baseUrl)
      send({ type: 'cache-result', requestId: request.requestId, ...cache })
    } else if (request.type === 'prepare') {
      await prepare()
      const cache = await artifactCache.inspect(baseUrl)
      send({ type: 'ready', requestId: request.requestId, device, cached: cache.cached, persistent: cache.persistent })
    } else if (request.type === 'analyze') {
      send({ type: 'analysis-result', requestId: request.requestId, results: await analyze(request.sentences) })
    } else if (request.type === 'clear-cache') {
      model?.dispose?.()
      model = null
      tokenizer = null
      device = null
      preparePromise = null
      await artifactCache.clear()
      send({ type: 'clear-result', requestId: request.requestId })
    }
  } catch (error) {
    const message = readableError(error)
    status({ stage: 'error', error: message, message })
    send({ type: 'request-error', requestId: request.requestId, message })
  }
})
