<template>
  <div class="analyse-page">
    <nav class="topbar">
      <RouterLink to="/" class="back-btn">← Back</RouterLink>
      <div class="topbar-title">
        <span class="logo-sm">PD</span>
        <h2 class="topbar-name">Analyse</h2>
      </div>
    </nav>

    <div class="page-body">
      <!-- Form Section -->
      <main class="analyse-form">
        <div class="form-header">
          <h1 class="form-title">New Analysis</h1>
          <p class="form-description">Upload a video or paste text to analyze for rhetorical devices</p>
        </div>

        <div class="input-tabs">
          <button 
            class="tab-btn"
            :class="{ active: inputMode === 'text' }"
            @click="inputMode = 'text'"
          >
            <span class="tab-icon">T</span>
            <span>Text</span>
          </button>
          <button 
            class="tab-btn"
            :class="{ active: inputMode === 'video' }"
            @click="inputMode = 'video'"
          >
            <span class="tab-icon">▶</span>
            <span>Video</span>
          </button>
        </div>

        <!-- Text Input -->
        <div v-if="inputMode === 'text'" class="input-section">
          <label class="input-label">Text Content</label>
          <textarea 
            v-model="textInput"
            class="text-input"
            placeholder="Paste text here to analyze..."
            :disabled="analyzing"
          />
          <span class="char-count">{{ textInput.length }} characters</span>
        </div>

        <!-- Video Input -->
        <div v-else class="input-section">
          <label class="input-label">Video File</label>
          <div 
            class="file-upload"
            @click="fileInput?.click()"
            @drop="onFileDrop"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            :class="{ 'drag-over': dragOver }"
          >
            <input 
              ref="fileInput"
              type="file"
              accept="video/*"
              @change="onFileSelect"
              hidden
            />
            <div class="upload-content">
              <span class="upload-icon">📹</span>
              <p class="upload-text">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <span class="upload-hint">MP4, WebM or Ogg (up to 100MB)</span>
            </div>
          </div>
          <div v-if="videoFile" class="file-selected">
            <span class="file-name">{{ videoFile.name }}</span>
            <button 
              type="button"
              class="clear-btn"
              @click="videoFile = null"
              :disabled="analyzing"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Analyze Button -->
        <button 
          class="analyze-btn"
          @click="analyzeContent"
          :disabled="analyzing || !canAnalyze"
        >
          <span v-if="analyzing" class="spinner"></span>
          <span>{{ analyzing ? 'Analyzing...' : 'Analyze' }}</span>
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </main>

      <!-- Results Section -->
      <Transition name="slide-up">
        <div v-if="results" class="results-section">
          <div class="results-header">
            <h2 class="results-title">Analysis Results</h2>
            <button class="close-btn" @click="results = null">✕</button>
          </div>

          <!-- Original Text -->
          <div class="original-text-block">
            <h3 class="block-title">Original Text</h3>
            <p class="original-text">{{ results.original_text }}</p>
          </div>

          <!-- Label Counts -->
          <div class="stats-grid">
            <div class="stat-card" v-for="stat in results.label_counts" :key="stat.label">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-count">{{ stat.count }}</div>
              <div class="stat-percentage">{{ stat.percentage }}%</div>
              <div 
                class="stat-bar"
                :style="{ width: stat.percentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Detected Segments -->
          <div class="segments-block">
            <h3 class="block-title">Detected Segments</h3>
            <div v-if="results.results.length === 0" class="no-segments">
              No rhetorical devices detected.
            </div>
            <div v-else class="segments-list">
              <div 
                class="segment-item"
                v-for="(result, idx) in results.results"
                :key="idx"
              >
                <div class="segment-content">
                  <p class="segment-text">{{ result.sentence }}</p>
                  <span class="segment-label" :data-label="result.label">
                    {{ result.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const inputMode = ref('text')
const textInput = ref('')
const videoFile = ref(null)
const fileInput = ref(null)
const dragOver = ref(false)
const analyzing = ref(false)
const results = ref(null)
const error = ref(null)

const canAnalyze = computed(() => {
  return inputMode.value === 'text' 
    ? textInput.value.trim().length > 0 
    : videoFile.value !== null
})

const onFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    videoFile.value = file
    dragOver.value = false
  }
}

const onFileDrop = (e) => {
  e.preventDefault()
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('video/')) {
    videoFile.value = file
  }
}

const analyzeContent = async () => {
  error.value = null
  analyzing.value = true
  results.value = null

  try {
    const formData = new FormData()
    
    if (inputMode.value === 'text') {
      formData.append('text', textInput.value)
    } else {
      formData.append('video', videoFile.value)
    }

    const response = await fetch('/api/analyse', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    results.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Failed to analyze content'
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
/* Noise background overlay - following LandingPage pattern */
.analyse-page {
  height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.analyse-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  z-index: 10;
  min-height: 64px;
  position: relative;
}

.back-btn {
  font-size: 14px;
  color: var(--text2);
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: var(--text);
}

.topbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 40px;
}

.logo-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--accent);
  color: var(--bg);
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 12px;
  font-family: var(--font-display);
}

.topbar-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 40px 32px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Form Styles */
.analyse-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-header {
  margin-bottom: 16px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px 0;
  font-family: var(--font-display);
}

.form-description {
  font-size: 14px;
  color: var(--text2);
  margin: 0;
}

/* Tabs */
.input-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--text2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-btn:hover:not(.active) {
  color: var(--text);
}

.tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Input Section */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

/* Text Input */
.text-input {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface2);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  height: 180px;
  transition: all 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 106, 255, 0.1);
}

.text-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.char-count {
  font-size: 12px;
  color: var(--text3);
  text-align: right;
}

/* File Upload */
.file-upload {
  padding: 32px;
  border: 2px dashed var(--border2);
  border-radius: var(--radius-lg);
  background: var(--surface2);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.file-upload:hover {
  border-color: var(--accent);
  background: var(--surface3);
}

.file-upload.drag-over {
  border-color: var(--accent);
  background: rgba(124, 106, 255, 0.1);
  transform: scale(1.01);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 40px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.file-upload:hover .upload-icon {
  transform: scale(1.1);
}

.upload-text {
  font-size: 14px;
  color: var(--text);
  margin: 0;
}

.upload-hint {
  font-size: 13px;
  color: var(--text3);
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-top: 8px;
  animation: slide-in-up 0.3s ease;
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-name {
  font-size: 13px;
  color: var(--text);
  font-family: var(--font-mono);
  word-break: break-word;
}

.clear-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border);
  border: none;
  border-radius: var(--radius);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  margin-left: 8px;
}

.clear-btn:hover:not(:disabled) {
  background: var(--border2);
  color: #ff3333;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Analyze Button */
.analyze-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.analyze-btn:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(124, 106, 255, 0.4);
  transform: translateY(-2px);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  padding: 12px;
  background: rgba(255, 51, 51, 0.1);
  border: 1px solid rgba(255, 51, 51, 0.3);
  border-radius: var(--radius);
  color: #ff6666;
  font-size: 13px;
  margin: 0;
  animation: slide-in-down 0.3s ease;
}

@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Results Section - Transition animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.results-section {
  margin-top: 48px;
  padding-top: 40px;
  border-top: 1px solid var(--border);
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.results-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  font-family: var(--font-display);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
}

.close-btn:hover {
  background: var(--surface3);
  color: #ff3333;
  transform: rotate(90deg);
}

/* Original Text Block */
.original-text-block {
  margin-bottom: 32px;
  animation: slide-in 0.4s ease 0.1s both;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.block-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.original-text {
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  line-height: 1.8;
  margin: 0;
  font-size: 14px;
  transition: all 0.2s ease;
}

.original-text:hover {
  border-color: var(--accent);
  background: var(--surface3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
  animation: slide-in 0.4s ease 0.15s both;
}

.stat-card {
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: default;
}

.stat-card:hover {
  border-color: var(--accent);
  background: var(--surface3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-count {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-mono);
  margin-bottom: 4px;
}

.stat-percentage {
  font-size: 12px;
  color: var(--text3);
  margin-bottom: 8px;
}

.stat-bar {
  height: 4px;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* Segments Block */
.segments-block {
  margin-bottom: 24px;
  animation: slide-in 0.4s ease 0.2s both;
}

.no-segments {
  padding: 24px;
  text-align: center;
  color: var(--text3);
  font-size: 14px;
  background: var(--surface2);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border);
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-item {
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
  opacity: 0;
  animation: slide-in 0.4s ease forwards;
}

/* Staggered animations for segments - following LandingPage pattern */
.segment-item:nth-child(1) { animation-delay: 0.25s; }
.segment-item:nth-child(2) { animation-delay: 0.31s; }
.segment-item:nth-child(3) { animation-delay: 0.37s; }
.segment-item:nth-child(4) { animation-delay: 0.43s; }
.segment-item:nth-child(n+5) { animation-delay: 0.49s; }

.segment-item:hover {
  border-color: var(--accent);
  background: var(--surface3);
  transform: translateX(4px);
}

.segment-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.segment-text {
  flex: 1;
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.segment-label {
  flex-shrink: 0;
  padding: 6px 12px;
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.segment-label[data-label] {
  background: var(--surface3);
  color: var(--text2);
  border: 1px solid var(--border);
}

/* Enhanced label styling with colors */
.segment-item:hover .segment-label {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .page-body {
    padding: 32px 24px;
  }

  .form-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .segment-content {
    flex-direction: column;
    gap: 8px;
  }

  .segment-label {
    align-self: flex-start;
  }
}
</style>