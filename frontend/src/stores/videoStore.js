import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function findActiveIndex(segments, t) {
  if (!segments.length) return -1
  let lo = 0, hi = segments.length - 1, result = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (segments[mid].start_time <= t) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (result === -1) return -1
  return t < segments[result].end_time ? result : -1
}

export const useVideoStore = defineStore('video', () => {
  const videos = ref([])
  const segments = ref([])
  const currentVideoId = ref(null)
  const currentTime = ref(0)
  const loading = ref(false)
  const error = ref(null)

  const activeIndex = computed(() => findActiveIndex(segments.value, currentTime.value))

  async function fetchVideos() {
    const res = await fetch('/api/videos')
    const data = await res.json()
    videos.value = data.videos
  }

  async function loadTranscript(videoId) {
    loading.value = true
    error.value = null
    segments.value = []
    currentVideoId.value = videoId
    currentTime.value = 0
    try {
      const res = await fetch(`/api/transcripts/${videoId}`)
      if (!res.ok) {
        const body = await res.json()
        error.value = body.detail?.error ?? 'unknown_error'
        return
      }
      const data = await res.json()
      segments.value = data.segments
    } catch (e) {
      error.value = 'network_error'
    } finally {
      loading.value = false
    }
  }

  function setCurrentTime(t) {
    currentTime.value = t
  }

  return { videos, segments, currentVideoId, currentTime, loading, error, activeIndex, fetchVideos, loadTranscript, setCurrentTime }
})
