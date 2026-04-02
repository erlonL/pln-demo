<template>
  <div class="video-page">
    <nav class="topbar">
      <RouterLink to="/" class="back-btn">← All Videos</RouterLink>
      <div class="topbar-title">
        <span class="logo-sm">PD</span>
        <h2 class="topbar-name">{{ videoStore.currentVideoId }}</h2>
      </div>
    </nav>

    <div class="page-body" v-if="!videoStore.loading && !videoStore.error">
      <!-- Main: Video takes most of the space -->
      <main class="main-col">
        <div class="video-wrapper">
          <VideoPlayer
            ref="playerRef"
            :src="videoSrc"
            :video-id="videoStore.currentVideoId"
            @timeupdate="videoStore.setCurrentTime"
            @play="playing = true"
            @pause="playing = false"
          />
          <!-- Only active label overlay -->
          <Transition name="fade">
            <div class="label-overlay" v-if="activeLabelMeta">
              <span
                class="label-chip"
                :style="{ borderColor: activeLabelMeta.color, color: activeLabelMeta.color }"
              >
                {{ videoStore.segments[videoStore.activeIndex]?.label }}
              </span>
            </div>
          </Transition>
        </div>

        <!-- Meaning panel below video -->
        <div class="meaning-row">
          <LabelMeaningPanel :label-meta="activeLabelMeta" />
        </div>
      </main>

      <!-- Right sidebar: Transcript + Labels -->
      <aside class="right-col">
        <div class="transcript-header">
          <span class="transcript-label">Transcript</span>
          <span class="time-display">{{ formatTime(videoStore.currentTime) }}</span>
        </div>

        <div class="transcript-scroll">
          <TranscriptList
            :segments="videoStore.segments"
            :active-index="videoStore.activeIndex"
            :enabled-labels="enabledLabels"
            @seek="onSeek"
          />
        </div>

        <!-- Collapsible Legend pinned at bottom of sidebar -->
        <div class="legend-section">
          <button class="collapse-toggle" @click="legendOpen = !legendOpen">
            <span>Labels</span>
            <span class="toggle-icon">{{ legendOpen ? '▾' : '▸' }}</span>
          </button>
          <Transition name="collapse">
            <div v-show="legendOpen" class="collapse-body">
              <LabelLegend
                :labels="labelStore.labels"
                :enabled-labels="enabledLabels"
                @toggle-label="toggleLabel"
              />
            </div>
          </Transition>
        </div>
      </aside>
    </div>

    <div v-else-if="videoStore.loading" class="full-state">
      <span class="pulse">Loading analysis...</span>
    </div>

    <div v-else-if="videoStore.error" class="full-state error">
      <span>Error: {{ videoStore.error }}</span>
      <RouterLink to="/" class="back-btn mt">← Back to videos</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useVideoStore } from '../stores/videoStore.js'
import { useLabelStore } from '../stores/labelStore.js'
import VideoPlayer from '../components/VideoPlayer.vue'
import TranscriptList from '../components/TranscriptList.vue'
import LabelLegend from '../components/LabelLegend.vue'
import LabelMeaningPanel from '../components/LabelMeaningPanel.vue'

const route = useRoute()
const videoStore = useVideoStore()
const labelStore = useLabelStore()
const playerRef = ref(null)
const playing = ref(false)
const legendOpen = ref(false)

const enabledLabels = ref(new Set())

const videoSrc = computed(() => {
  if (!videoStore.currentVideoId) return null
  return `/media/${videoStore.currentVideoId}.mp4`
})

const activeLabelMeta = computed(() => {
  if (videoStore.activeIndex < 0) return null
  const seg = videoStore.segments[videoStore.activeIndex]
  return seg ? labelStore.getLabelMeta(seg.label) : null
})

const visibleCount = computed(() => {
  return videoStore.segments.filter(s => enabledLabels.value.has(s.label)).length
})

function toggleLabel(name) {
  const next = new Set(enabledLabels.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  enabledLabels.value = next
}

function onSeek(t) {
  playerRef.value?.seekTo(t)
  videoStore.setCurrentTime(t)
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

onMounted(async () => {
  const videoId = route.params.video_id
  await Promise.all([
    videoStore.loadTranscript(videoId),
    labelStore.fetchLabels(),
  ])
  enabledLabels.value = new Set(labelStore.labels.map(l => l.name))
})
</script>

<style scoped>
.video-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.back-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text3);
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  text-decoration: none;
  display: inline-block;
}

.back-btn:hover {
  color: #ff3333;
  border-color: #ff3333;
  background: rgba(255, 51, 51, 0.05);
}

.back-btn.mt {
  margin-top: 16px;
  display: inline-block;
}

.topbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.logo-sm {
  background: #ff3333;
  color: white;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.topbar-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.5px;
}

.page-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Main video area fills remaining space */
.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #000;
}

.video-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

/* Only label overlay — minimal, top-left corner */
.label-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  pointer-events: none;
  z-index: 10;
}

.label-chip {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1.5px solid currentColor;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Meaning panel below video, compact */
.meaning-row {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(8px);
}

/* Right sidebar — fixed width, contains transcript + labels */
.right-col {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(26, 26, 26, 0.9);
  overflow: hidden;
}

.transcript-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.4);
}

.transcript-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text3);
  font-weight: 600;
}

.time-display {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: #ff3333;
  background: rgba(255, 51, 51, 0.1);
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 51, 51, 0.3);
}

/* Transcript scrolls, legend stays pinned at bottom */
.transcript-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* Legend pinned to bottom of sidebar */
.legend-section {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.4);
}

.collapse-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  transition: color 0.15s, background 0.15s;
  font-weight: 600;
}

.collapse-toggle:hover {
  color: #ff3333;
  background: rgba(255, 51, 51, 0.05);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text3);
  transition: color 0.15s;
}

.collapse-toggle:hover .toggle-icon {
  color: #ff3333;
}

.collapse-body {
  padding: 8px 16px 12px;
  overflow: hidden;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: bottom;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

.full-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 13px;
  gap: 8px;
}

.full-state.error {
  color: #ff3333;
}

.pulse {
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>