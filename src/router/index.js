import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import OnlineDetect from '../views/OnlineDetect.vue'
import OfflineDetect from '../views/OfflineDetect.vue'
import Result from '../views/Result.vue'
import ErrorPage from '../views/Error.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/online/:taskId', name: 'OnlineDetect', component: OnlineDetect, props: true },
  { path: '/offline/:taskId', name: 'OfflineDetect', component: OfflineDetect, props: true },
  { path: '/result/:taskId', name: 'Result', component: Result, props: true },
  { path: '/error', name: 'ErrorPage', component: ErrorPage },
  { path: '/:pathMatch(.*)*', redirect: '/error' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router