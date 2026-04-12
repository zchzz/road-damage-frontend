import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import DetectOnline from '@/views/DetectOnline.vue'
import DetectOffline from '@/views/DetectOffline.vue'
import TaskDetail from '@/views/TaskDetail.vue'
import Result from '@/views/Result.vue'
import ErrorPage from '@/views/Error.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页'
    }
  },
  {
    path: '/detect/online',
    name: 'DetectOnline',
    component: DetectOnline,
    meta: {
      title: '在线分析'
    }
  },
  {
    path: '/detect/offline',
    name: 'DetectOffline',
    component: DetectOffline,
    meta: {
      title: '离线分析'
    }
  },
  {
    path: '/task/:taskId',
    name: 'TaskDetail',
    component: TaskDetail,
    props: true,
    meta: {
      title: '任务详情'
    }
  },
  {
    path: '/result/:taskId',
    name: 'Result',
    component: Result,
    props: true,
    meta: {
      title: '检测结果'
    }
  },
  {
    path: '/error',
    name: 'ErrorPage',
    component: ErrorPage,
    meta: {
      title: '错误页面'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/error'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return {
      top: 0
    }
  }
})

router.afterEach((to) => {
  const pageTitle = to.meta?.title
  document.title = pageTitle
    ? `${pageTitle} - 道路病害智能检测系统`
    : '道路病害智能检测系统'
})

export default router