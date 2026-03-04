import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import VideoPage from '../pages/VideoPage.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/video/:video_id', component: VideoPage },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
