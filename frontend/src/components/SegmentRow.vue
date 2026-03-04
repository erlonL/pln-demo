<template>
  <div
    class="segment-row"
    :class="{ active: isActive }"
    :tabindex="0"
    role="listitem"
    :aria-label="`${formatTime(segment.start_time)} to ${formatTime(segment.end_time)}: ${segment.text}`"
    @click="emit('seek', segment.start_time)"
    @keydown.enter="emit('seek', segment.start_time)"
    @keydown.space.prevent="emit('seek', segment.start_time)"
  >
    <div class="row-time">
      <span class="time-start">{{ formatTime(segment.start_time) }}</span>
      <span class="time-sep">–</span>
      <span class="time-end">{{ formatTime(segment.end_time) }}</span>
    </div>
    <div class="row-content">
      <p class="row-text">{{ segment.text }}</p>
    </div>
    <div class="row-label">
      <span
        class="label-badge"
        :style="{ background: hexToRgba(labelMeta.color, 0.15), color: labelMeta.color, borderColor: hexToRgba(labelMeta.color, 0.35) }"
      >{{ labelMeta.name }}</span>
    </div>
    <div v-if="isActive" class="active-indicator" :style="{ background: labelMeta.color }"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  segment: Object,
  isActive: Boolean,
  labelMeta: Object,
})
const emit = defineEmits(['seek'])

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<style scoped>
.segment-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  outline: none;
}

.segment-row:hover {
  background: var(--surface2);
}

.segment-row:focus-visible {
  background: var(--surface2);
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.segment-row.active {
  background: var(--active-row);
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
}

.row-time {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  min-width: 80px;
  padding-top: 3px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
}

.time-sep {
  color: var(--border2);
}

.row-content {
  flex: 1;
}

.row-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.55;
}

.segment-row.active .row-text {
  color: var(--text);
}

.row-label {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.label-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
</style>
