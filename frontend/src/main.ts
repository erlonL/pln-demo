import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow-condensed/latin-900.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import App from './App.vue'
import './styles/tokens.css'
import './styles/primitives.css'
import './style.css'

registerSW({ immediate: true })
createApp(App).mount('#app')
