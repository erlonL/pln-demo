<template>
  <div class="transcript-list" ref="listEl" role="list">
    <div v-if="!segments.length" class="empty-state">
      <span>Nenhum segmento para exibir.</span>
    </div>
    <template v-for="(seg, i) in segments" :key="seg.start_time">
      <SegmentRow
        v-if="enabledLabels.has(seg.label)"
        :ref="el => { if (el) rowRefs[i] = el }"
        :segment="seg"
        :is-active="i === activeIndex"
        :label-meta="getLabelMeta(seg.label)"
        @seek="emit('seek', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import SegmentRow from './SegmentRow.vue'
import { useLabelStore } from '../stores/labelStore.js'

const props = defineProps({
  segments: Array,
  activeIndex: Number,
  enabledLabels: Set,
})
const emit = defineEmits(['seek'])

const labelStore = useLabelStore()
const { getLabelMeta } = labelStore

const listEl = ref(null)
const rowRefs = ref({})

watch(() => props.activeIndex, async (idx) => {
  if (idx === -1) return
  await nextTick()
  const el = rowRefs.value[idx]?.$el ?? rowRefs.value[idx]
  if (el) {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
})
</script>

<style scoped>
.transcript-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  padding: 40px 20px;
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: center;
}
</style>
