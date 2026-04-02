import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import VideoPage from '../pages/VideoPage.vue'
import AnalysePage from '../pages/AnalysePage.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/video/:video_id', component: VideoPage },
  { path: '/analyse', component: AnalysePage },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
