import { onBeforeUnmount, ref } from 'vue'
import { MODEL_MANIFEST } from './manifest'
import type { AnalysisResult, ModelStatus, RuntimeDevice, SentenceSegment, WorkerRequest, WorkerResponse } from './types'

const INITIAL_STATUS: ModelStatus = {
  stage: 'idle', progress: 0, loadedBytes: 0, totalBytes: MODEL_MANIFEST.totalBytes,
  cached: false, persistent: typeof caches !== 'undefined', device: null, message: 'Modelo ainda não preparado',
}

export function useModel() {
  const modelStatus = ref<ModelStatus>({ ...INITIAL_STATUS })
  const worker = new Worker(new URL('./model.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>()

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data
    if (response.type === 'status') {
      modelStatus.value = { ...modelStatus.value, ...response.status }
      return
    }
    if (response.type === 'request-error') {
      pending.get(response.requestId)?.reject(new Error(response.message))
      pending.delete(response.requestId)
      return
    }
    if ('requestId' in response) {
      pending.get(response.requestId)?.resolve(response)
      pending.delete(response.requestId)
    }
  })
  worker.addEventListener('error', (event) => {
    const message = event.message || 'O processo local do modelo foi interrompido.'
    modelStatus.value = { ...modelStatus.value, stage: 'error', error: message, message }
    for (const task of pending.values()) task.reject(new Error(message))
    pending.clear()
  })

  function request<T extends WorkerResponse>(payload: any): Promise<T> {
    const requestId = crypto.randomUUID()
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject })
      worker.postMessage({ ...payload, requestId } as WorkerRequest)
    })
  }

  async function inspectCache() {
    modelStatus.value = { ...modelStatus.value, stage: 'checking', message: 'Verificando modelo salvo' }
    const response = await request<Extract<WorkerResponse, { type: 'cache-result' }>>({ type: 'inspect-cache' })
    modelStatus.value = {
      ...modelStatus.value,
      stage: response.cached ? 'cached' : 'idle', cached: response.cached, persistent: response.persistent,
      loadedBytes: response.bytes, message: response.cached ? 'Modelo armazenado neste navegador' : 'Modelo ainda não baixado',
    }
  }

  async function prepareModel(): Promise<RuntimeDevice> {
    const response = await request<Extract<WorkerResponse, { type: 'ready' }>>({ type: 'prepare' })
    return response.device
  }

  async function analyze(sentences: SentenceSegment[]): Promise<AnalysisResult[]> {
    const response = await request<Extract<WorkerResponse, { type: 'analysis-result' }>>({ type: 'analyze', sentences })
    return response.results
  }

  async function clearCache(): Promise<void> {
    await request<Extract<WorkerResponse, { type: 'clear-result' }>>({ type: 'clear-cache' })
    modelStatus.value = { ...INITIAL_STATUS, persistent: typeof caches !== 'undefined' }
  }

  onBeforeUnmount(() => worker.terminate())
  return { modelStatus, inspectCache, prepareModel, analyze, clearCache }
}
