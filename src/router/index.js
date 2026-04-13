import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import DetectVideo from '@/views/DetectVideo.vue'
import TaskDetail from '@/views/TaskDetail.vue'
import Result from '@/views/Result.vue'
import ErrorPage from '@/views/Error.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/detect',
    name: 'DetectVideo',
    component: DetectVideo,
    meta: { title: '视频分析' }
  },
  {
    path: '/task/:taskId',
    name: 'TaskDetail',
    component: TaskDetail,
    props: true,
    meta: { title: '任务详情' }
  },
  {
    path: '/result/:taskId',
    name: 'Result',
    component: Result,
    props: true,
    meta: { title: '分析结果' }
  },
  {
    path: '/error',
    name: 'ErrorPage',
    component: ErrorPage,
    meta: { title: '错误页面' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/error'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} - 道路病害视频分析平台`
    : '道路病害视频分析平台'
})

export default router