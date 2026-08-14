export type ModelStage =
  | 'idle'
  | 'checking'
  | 'cached'
  | 'downloading'
  | 'initializing'
  | 'ready'
  | 'analyzing'
  | 'error'

export type RuntimeDevice = 'webgpu' | 'wasm' | null

export interface ModelStatus {
  stage: ModelStage
  progress: number
  loadedBytes: number
  totalBytes: number
  cached: boolean
  persistent: boolean
  device: RuntimeDevice
  message: string
  error?: string
}

export interface SentenceSegment {
  text: string
  start: number
  end: number
  paragraph: number
}

export interface Candidate {
  labelId: string
  probability: number
}

export interface AnalysisResult extends SentenceSegment {
  labelId: string
  probability: number
  alternatives: Candidate[]
  tokenCount: number
  tokensUsed: number
  truncated: boolean
}

export type WorkerRequest =
  | { type: 'inspect-cache'; requestId: string }
  | { type: 'prepare'; requestId: string }
  | { type: 'analyze'; requestId: string; sentences: SentenceSegment[] }
  | { type: 'clear-cache'; requestId: string }

export type WorkerResponse =
  | { type: 'status'; status: Partial<ModelStatus> }
  | { type: 'cache-result'; requestId: string; cached: boolean; persistent: boolean; bytes: number }
  | { type: 'ready'; requestId: string; device: RuntimeDevice; cached: boolean; persistent: boolean }
  | { type: 'analysis-result'; requestId: string; results: AnalysisResult[] }
  | { type: 'clear-result'; requestId: string }
  | { type: 'request-error'; requestId: string; message: string }
