<template>
  <div class="landing">
    <div class="landing-noise"></div>
    
    <!-- Full banner background with overlay content -->
    <div class="hero-banner">
      <img src="/banner.png" alt="Beyond Words Banner" class="banner-image" />
      <!-- Gradient overlay to blend edges -->
      <div class="banner-fade"></div>
      
      <!-- Content overlaid on banner -->
      <div class="banner-content">
        <div class="hero-text">
          <p class="hero-label">PROCESSAMENTO DE LINGUAGEM NATURAL 2025.2</p>
          <h1 class="hero-title">ALÉM DAS<br>PALAVRAS</h1>
          <p class="hero-subtitle">Um estudo sobre identificação de intenções na política mundial</p>
        </div>
      </div>
    </div>

    <!-- Content below banner - seamlessly integrated -->
    <div class="landing-content">
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
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

.landing-noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* Full banner as hero background */
.hero-banner {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: visible;
}

.banner-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Gradient fade on edges to blend into background */
.banner-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0) 0%,
    rgba(10, 10, 10, 0) 70%,
    rgba(10, 10, 10, 0.4) 85%,
    rgba(10, 10, 10, 0.8) 95%,
    rgba(10, 10, 10, 1) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* Horizontal fade on sides */
.banner-fade::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(10, 10, 10, 0.3) 0%,
    rgba(10, 10, 10, 0) 15%,
    rgba(10, 10, 10, 0) 85%,
    rgba(10, 10, 10, 0.3) 100%
  );
}

/* Content overlaid on banner */
.banner-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 60px 32px;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
}

.hero-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 72px;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -2px;
  color: #ff3333;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.9), 0 8px 32px rgba(0, 0, 0, 0.7);
  margin: 0;
}

.hero-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 400px;
  line-height: 1.4;
  margin: 0;
}

/* Content below banner - seamlessly integrated */
.landing-content {
  position: relative;
  z-index: 3;
  width: 100%;
  padding: 60px 32px 60px;
  background: #0a0a0a;
}

.videos-section {
  margin-bottom: 40px;
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
  margin: 0;
  padding: 0;
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
  text-decoration: none;
}

.video-card-inner:hover {
  border-color: #ff3333;
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
  color: #ff3333;
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
  margin: 0;
}

.video-arrow {
  font-size: 18px;
  color: var(--text3);
  transition: color 0.2s, transform 0.2s;
}

.video-card-inner:hover .video-arrow {
  color: #ff3333;
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

@media (max-width: 768px) {
  .hero-banner {
    height: 400px;
  }

  .banner-content {
    padding: 40px 24px;
  }

  .hero-text {
    gap: 16px;
  }

  .hero-title {
    font-size: 48px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .landing-content {
    padding: 50px 24px 40px;
  }
}
</style>