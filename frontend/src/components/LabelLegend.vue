<template>
  <div class="legend">
    <div class="legend-title">Rótulos</div>
    <div class="chips">
      <button
        v-for="label in labels"
        :key="label.name"
        class="chip"
        :class="{ disabled: !enabledLabels.has(label.name) }"
        :style="enabledLabels.has(label.name) ? {
          background: hexToRgba(label.color, 0.15),
          color: label.color,
          borderColor: hexToRgba(label.color, 0.4),
        } : {}"
        :title="label.meaning"
        @click="emit('toggleLabel', label.name)"
      >
        <span class="chip-dot" :style="{ background: label.color }"></span>
        {{ label.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  labels: Array,
  enabledLabels: Set,
})
const emit = defineEmits(['toggleLabel'])

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<style scoped>
.legend {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.legend-title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 4px 9px;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text3);
  background: var(--surface2);
  transition: all 0.15s;
  cursor: pointer;
}

.chip:hover {
  opacity: 0.85;
}

.chip.disabled {
  opacity: 0.35;
  background: var(--surface);
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
