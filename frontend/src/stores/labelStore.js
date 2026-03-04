import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLabelStore = defineStore('labels', () => {
  const labels = ref([])
  const loaded = ref(false)

  async function fetchLabels() {
    if (loaded.value) return
    const res = await fetch('/api/labels')
    const data = await res.json()
    labels.value = data.labels
    loaded.value = true
  }

  const labelMap = computed(() => {
    const m = new Map()
    for (const l of labels.value) m.set(l.name, l)
    return m
  })

  function getLabelMeta(name) {
    return labelMap.value.get(name) ?? { name, color: '#6B7280', meaning: '' }
  }

  return { labels, loaded, fetchLabels, labelMap, getLabelMeta }
})
