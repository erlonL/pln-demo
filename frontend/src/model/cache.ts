import { MODEL_CACHE_NAME, MODEL_CACHE_PREFIX, MODEL_MANIFEST } from './manifest'

type CacheRequest = RequestInfo | URL
type ProgressCallback = (progress: { loaded: number; total: number; progress: number }) => void

function requestKey(request: CacheRequest): string {
  if (typeof request === 'string') return request
  if (request instanceof URL) return request.href
  return request.url
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export class ModelArtifactCache {
  readonly cacheName = MODEL_CACHE_NAME
  private readonly validated = new Set<string>()

  get available(): boolean {
    return typeof caches !== 'undefined' && typeof crypto?.subtle !== 'undefined'
  }

  private artifactFor(request: CacheRequest) {
    const key = decodeURI(requestKey(request))
    return MODEL_MANIFEST.artifacts.find((artifact) => key.endsWith(`/${MODEL_MANIFEST.id}/${artifact.path}`))
  }

  async match(request: CacheRequest): Promise<Response | undefined> {
    if (!this.available) return undefined
    const artifact = this.artifactFor(request)
    if (!artifact) return undefined
    const cache = await caches.open(this.cacheName)
    const response = await cache.match(request)
    if (!response) return undefined

    const key = requestKey(request)
    if (!this.validated.has(key)) {
      const buffer = await response.clone().arrayBuffer()
      const valid = buffer.byteLength === artifact.bytes && (await sha256(buffer)) === artifact.sha256
      if (!valid) {
        await cache.delete(request)
        this.validated.delete(key)
        return undefined
      }
      this.validated.add(key)
    }
    return response
  }

  async put(request: CacheRequest, response: Response, progress?: ProgressCallback): Promise<void> {
    if (!this.available) return
    const artifact = this.artifactFor(request)
    if (!artifact) return
    const buffer = await response.arrayBuffer()
    progress?.({ loaded: buffer.byteLength, total: artifact.bytes, progress: 100 })
    if (buffer.byteLength !== artifact.bytes || (await sha256(buffer)) !== artifact.sha256) {
      throw new Error(`Falha de integridade ao baixar ${artifact.path}.`)
    }
    const headers = new Headers(response.headers)
    headers.set('content-length', String(buffer.byteLength))
    const cache = await caches.open(this.cacheName)
    await cache.put(request, new Response(buffer, { status: 200, headers }))
    this.validated.add(requestKey(request))
  }

  async fetchArtifact(baseUrl: string, path: string, progress?: ProgressCallback): Promise<Response> {
    const url = this.artifactUrl(baseUrl, path)
    const cached = await this.match(url)
    if (cached) return cached

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Não foi possível baixar ${path} (${response.status}).`)
    await this.put(url, response.clone(), progress)
    const stored = await this.match(url)
    if (!stored) throw new Error(`Não foi possível validar ${path} após o download.`)
    return stored
  }

  private artifactUrl(baseUrl: string, path: string): string {
    return new URL(`models/${MODEL_MANIFEST.id}/${path}`, baseUrl).href
  }

  async inspect(baseUrl: string): Promise<{ cached: boolean; bytes: number; persistent: boolean }> {
    if (!this.available) return { cached: false, bytes: 0, persistent: false }
    let bytes = 0
    for (const artifact of MODEL_MANIFEST.artifacts) {
      const response = await this.match(this.artifactUrl(baseUrl, artifact.path))
      if (!response) return { cached: false, bytes, persistent: true }
      bytes += artifact.bytes
    }
    return { cached: true, bytes, persistent: true }
  }

  async cleanupObsolete(): Promise<void> {
    if (!this.available) return
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith(MODEL_CACHE_PREFIX) && name !== this.cacheName).map((name) => caches.delete(name)))
  }

  async clear(): Promise<void> {
    this.validated.clear()
    if (this.available) await caches.delete(this.cacheName)
  }
}
