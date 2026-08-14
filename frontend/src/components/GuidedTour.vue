<template>
  <Teleport to="body">
    <div v-if="modelValue" class="tour-layer" @keydown="onKeydown">
      <div class="tour-scrim" aria-hidden="true"></div>
      <section
        ref="card"
        class="tour-card"
        :style="position"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabindex="-1"
      >
        <div class="tour-progress" aria-hidden="true">
          <span v-for="(_, index) in steps" :key="index" :class="{ active: index <= stepIndex }"></span>
        </div>
        <p class="eyebrow">Guia · {{ stepIndex + 1 }} de {{ steps.length }}</p>
        <h2 id="tour-title">{{ current.title }}</h2>
        <p>{{ current.body }}</p>
        <div class="tour-actions">
          <button class="text-button" type="button" @click="finish">Pular guia</button>
          <div>
            <button v-if="stepIndex > 0" class="button secondary small" type="button" @click="previous">Voltar</button>
            <button class="button primary small" type="button" @click="next">{{ stepIndex === steps.length - 1 ? 'Concluir' : 'Próximo' }}</button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const steps = [
  { selector: '[data-tour="intro"]', title: 'O que este detector faz', body: 'Ele classifica cada sentença em uma entre sete técnicas persuasivas ou como neutra. Não decide se uma notícia é verdadeira.' },
  { selector: '[data-tour="editor"]', title: 'Comece pelo texto', body: 'Cole uma notícia, artigo ou opinião. A análise aceita até 50 mil caracteres e preserva a ordem das sentenças.' },
  { selector: '[data-tour="examples"]', title: 'Ou experimente um exemplo', body: 'Os exemplos curtos vêm do contexto da pesquisa e incluem casos claros, mistos e um erro discutido no artigo.' },
  { selector: '[data-tour="segmentation"]', title: 'Uma sentença de cada vez', body: 'O navegador segmenta o texto com Intl.Segmenter. Cada trecho é então tokenizado exatamente como no treinamento.' },
  { selector: '[data-tour="model"]', title: 'O modelo vem até você', body: 'O BERT-Tiny tem cerca de 18,3 MB com o tokenizer. Ele só é baixado quando você pede e fica armazenado neste navegador.' },
  { selector: '[data-tour="analyze"]', title: 'Inferência local', body: 'Ao analisar, seu texto entra apenas no worker local. A aplicação não envia o conteúdo para um servidor.' },
  { selector: '[data-tour="results-placeholder"]', title: 'Texto como visualização', body: 'Depois da análise, cada sentença recebe uma marca de cor ligada à técnica prevista.' },
  { selector: '[data-tour="taxonomy"]', title: 'Leia as classes com contexto', body: 'A taxonomia mantém as traduções usadas no artigo e mostra também o identificador técnico armazenado pelo modelo.' },
  { selector: '[data-tour="research"]', title: 'Resultado de pesquisa, não oráculo', body: 'O artigo relata 86% de acurácia. Classes próximas e sentenças neutras ainda confundem o modelo.' },
  { selector: '[data-tour="privacy"]', title: 'Privacidade verificável', body: 'Modelo e aplicação podem ser reutilizados offline após o primeiro carregamento bem-sucedido.' },
]

const stepIndex = ref(0)
const card = ref<HTMLElement | null>(null)
const position = ref<Record<string, string>>({ bottom: '24px', left: '24px' })
const current = computed(() => steps[stepIndex.value] ?? steps[0]!)
let activeTarget: HTMLElement | null = null

function place() {
  activeTarget?.classList.remove('tour-target')
  activeTarget = document.querySelector<HTMLElement>(current.value.selector)
  if (!activeTarget) {
    position.value = { bottom: '24px', left: '24px' }
    return
  }
  activeTarget.classList.add('tour-target')
  activeTarget.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  const rect = activeTarget.getBoundingClientRect()
  const width = Math.min(390, window.innerWidth - 32)
  const left = Math.max(16, Math.min(window.innerWidth - width - 16, rect.left))
  const roomBelow = window.innerHeight - rect.bottom
  const top = roomBelow > 300 ? rect.bottom + 16 : Math.max(16, rect.top - 280)
  position.value = { top: `${top}px`, left: `${left}px`, width: `${width}px` }
}

function next() {
  if (stepIndex.value === steps.length - 1) finish()
  else stepIndex.value += 1
}
function previous() { stepIndex.value = Math.max(0, stepIndex.value - 1) }
function finish() {
  activeTarget?.classList.remove('tour-target')
  emit('update:modelValue', false)
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') finish()
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') previous()
}

watch([() => props.modelValue, stepIndex], async ([open]) => {
  if (!open) return
  await nextTick()
  place()
  card.value?.focus()
}, { immediate: true })

window.addEventListener('resize', place)
onBeforeUnmount(() => {
  window.removeEventListener('resize', place)
  activeTarget?.classList.remove('tour-target')
})
</script>
