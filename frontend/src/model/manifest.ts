export const MODEL_MANIFEST = {
  id: 'persuasion-bert-tiny-v1',
  displayName: 'BERT-Tiny — Persuasão PT-BR',
  version: '1.0.0',
  sourceCheckpoint: 'backend/modelo3',
  sourceSha256: 'a5ce082ed1aa2c61def5c5d8f36b907e6c72e2b8cb217493b9c11487add7607b',
  maxTokens: 512,
  modelBytes: 17_591_749,
  totalBytes: 18_305_019,
  artifacts: [
    {
      path: 'config.json',
      bytes: 1_246,
      sha256: '7d40e5fc3ed2bf1756e2d8c79c91c6b4be43be3985b0998c8c514afebd7bdb26',
    },
    {
      path: 'tokenizer.json',
      bytes: 711_661,
      sha256: 'cb374d6bc042c22455946f4e09a89d29882a199fdaf8fb25be00dc8b8857a448',
    },
    {
      path: 'tokenizer_config.json',
      bytes: 363,
      sha256: 'fb0fca536b4a1f39add44f61daad6fa3fe5e14070fcfc33f06f8ed1ef30c19c1',
    },
    {
      path: 'onnx/model.onnx',
      bytes: 17_591_749,
      sha256: '7118dbdb237580e5ac32f1553c142c90467a9af6e4723a09657f12c727f2e2da',
    },
  ],
} as const

export const MODEL_CACHE_PREFIX = 'alem-das-palavras:model:'
export const MODEL_CACHE_NAME = `${MODEL_CACHE_PREFIX}${MODEL_MANIFEST.id}:${MODEL_MANIFEST.version}:${MODEL_MANIFEST.artifacts[3].sha256.slice(0, 12)}`

export function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} kB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}
