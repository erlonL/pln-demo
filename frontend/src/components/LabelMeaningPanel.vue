<template>
  <div class="meaning-panel" v-if="labelMeta">
    <div class="panel-header">
      <span
        class="panel-dot"
        :style="{ background: labelMeta.color }"
      ></span>
      <span class="panel-name" :style="{ color: labelMeta.color }">{{ labelMeta.name }}</span>
    </div>
    <p class="panel-meaning">{{ labelMeta.meaning }}</p>
  </div>
  <div class="meaning-panel empty" v-else>
    <span>Reproduza o vídeo para ver a técnica ativa</span>
  </div>
</template>

<script setup>
defineProps({
  labelMeta: Object,
})
</script>

<style scoped>
.meaning-panel {
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  min-height: 80px;
}

.meaning-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 11px;
  min-height: 80px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.panel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.panel-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
}

.panel-meaning {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.6;
}
</style>
