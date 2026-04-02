<template>
  <div class="player-wrap">
    <video
      ref="videoEl"
      :src="src"
      controls
      class="video-el"
      @timeupdate="onTimeUpdate"
      @play="emit('play')"
      @pause="emit('pause')"
      @loadedmetadata="onLoaded"
    />
    <div v-if="!src" class="no-video">
      <span>Nenhum arquivo de vídeo disponível para esta análise.</span>
      <small>Coloque um MP4 em <code>backend/data/videos/{{ videoId }}.mp4</code></small>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: String,
  videoId: String,
})
const emit = defineEmits(['timeupdate', 'play', 'pause', 'loadedmetadata'])
const videoEl = ref(null)

function onTimeUpdate() {
  emit('timeupdate', videoEl.value?.currentTime ?? 0)
}

function onLoaded() {
  emit('loadedmetadata', videoEl.value?.duration ?? 0)
}

function seekTo(t) {
  if (videoEl.value) videoEl.value.currentTime = t
}

defineExpose({ seekTo })
</script>

<style scoped>
.player-wrap {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
}

.no-video {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: var(--text3);
  font-size: 13px;
  text-align: center;
  background: var(--surface);
  height: 100%;
  width: 100%;
  justify-content: center;
}

.no-video code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  background: var(--surface2);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>