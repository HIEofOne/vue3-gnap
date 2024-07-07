import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import GNAP from './components/GNAP.vue'

createApp(App).component('GNAP', GNAP).mount('#app')
