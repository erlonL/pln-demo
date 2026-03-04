<template>
  <div class="landing">
    <div class="landing-noise"></div>
    <div class="landing-inner">
      <header class="landing-header">
        <div class="logo-mark">PD</div>
        <div class="header-text">
          <h1 class="site-title">Persuasion<br>Detector</h1>
          <p class="site-sub">Automated analysis of rhetorical techniques in video content.</p>
        </div>
      </header>

      <section class="videos-section">
        <div class="section-label">— Available Analyses</div>

        <div v-if="loading" class="state-msg">
          <span class="pulse">Loading...</span>
        </div>
        <div v-else-if="!videoStore.videos.length" class="state-msg empty">
          No video analyses found.
        </div>
        <ul v-else class="video-list">
          <li
            v-for="(video, i) in videoStore.videos"
            :key="video.video_id"
            class="video-card"
            :style="{ animationDelay: `${i * 60}ms` }"
          >
            <RouterLink :to="`/video/${video.video_id}`" class="video-card-inner">
              <div class="video-meta">
                <span class="video-id">{{ video.video_id }}</span>
                <span class="video-badge">{{ segmentCountLabels[video.video_id] ?? '–' }} segments</span>
              </div>
              <h2 class="video-title">{{ video.title }}</h2>
              <div class="video-arrow">→</div>
            </RouterLink>
          </li>
        </ul>
      </section>

      <footer class="landing-footer">
        <span>Persuasion Detector — Local Demo</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useVideoStore } from '../stores/videoStore.js'
import { useLabelStore } from '../stores/labelStore.js'

const videoStore = useVideoStore()
const labelStore = useLabelStore()
const loading = ref(true)
const segmentCountLabels = ref({})

onMounted(async () => {
  await Promise.all([videoStore.fetchVideos(), labelStore.fetchLabels()])
  // Pre-fetch segment counts
  for (const v of videoStore.videos) {
    try {
      const res = await fetch(`/api/transcripts/${v.video_id}`)
      if (res.ok) {
        const data = await res.json()
        segmentCountLabels.value[v.video_id] = data.segments.length
      }
    } catch {}
  }
  loading.value = false
})
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

.landing-noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.landing-inner {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 60px 32px;
}

.landing-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 72px;
}

.logo-mark {
  width: 56px;
  height: 56px;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 1px;
  border-radius: var(--radius);
  flex-shrink: 0;
  margin-top: 6px;
}

.site-title {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -1px;
  color: var(--text);
}

.site-sub {
  margin-top: 10px;
  color: var(--text2);
  font-size: 15px;
  max-width: 400px;
}

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.video-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-card {
  opacity: 0;
  animation: slide-in 0.4s ease forwards;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.video-card-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.video-card-inner:hover {
  border-color: var(--accent);
  background: var(--surface2);
  transform: translateX(4px);
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}

.video-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.5px;
}

.video-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
}

.video-title {
  flex: 1;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--text);
}

.video-arrow {
  font-size: 18px;
  color: var(--text3);
  transition: color 0.2s, transform 0.2s;
}

.video-card-inner:hover .video-arrow {
  color: var(--accent);
  transform: translateX(4px);
}

.state-msg {
  padding: 40px 0;
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 13px;
}

.pulse {
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.landing-footer {
  margin-top: 80px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.5px;
}
</style>
