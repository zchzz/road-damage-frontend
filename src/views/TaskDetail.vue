<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <div>
          <h1>任务详情</h1>
          <p class="muted">任务 ID：{{ taskId }}</p>
        </div>

        <div class="actions">
          <el-button @click="goHome">返回首页</el-button>
          <el-button @click="goResult" :disabled="status !== 'completed'">
            查看结果
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="fatalError"
        :title="fatalError"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />

      <div class="meta">
        <el-tag>{{ status }}</el-tag>
        <el-tag :type="wsConnected ? 'success' : 'info'">
          {{ wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接' }}
        </el-tag>
        <el-tag :type="pollingActive ? 'warning' : 'info'">
          {{ pollingActive ? '轮询中' : '轮询停止' }}
        </el-tag>
      </div>

      <div class="section">
        <div class="row">
          <span>当前状态</span>
          <strong>{{ message }}</strong>
        </div>
        <div class="row">
          <span>任务进度</span>
          <strong>{{ progress }}%</strong>
        </div>
        <el-progress :percentage="progress" />
      </div>

      <div class="section">
        <div class="row">
          <span>当前帧</span>
          <strong>{{ currentFrameText }}</strong>
        </div>
        <div class="row">
          <span>总帧数</span>
          <strong>{{ totalFramesText }}</strong>
        </div>
      </div>

      <div class="section">
        <h3>原始任务数据</h3>
        <pre class="code">{{ prettyTask }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask, getTaskWsUrl, getResult, resolveBackendFileUrl } from '@/api'
const props = defineProps({
  taskId: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()

const taskId = computed(() => props.taskId || route.params.taskId)

const task = ref({})
const fatalError = ref('')
const wsRef = ref(null)
const wsConnected = ref(false)
const pollingActive = ref(false)
const hasRedirected = ref(false)

let timer = null

const status = computed(() => String(task.value?.status || 'pending').toLowerCase())
const message = computed(() => task.value?.message || '任务处理中...')
const progress = computed(() => {
  const value = Number(task.value?.progress || 0)
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
})
const currentFrameText = computed(() => {
  const value = task.value?.current_frame
  return value === undefined || value === null ? '-' : String(value)
})
const totalFramesText = computed(() => {
  const value = task.value?.total_frames
  return value === undefined || value === null ? '-' : String(value)
})
const prettyTask = computed(() => JSON.stringify(task.value || {}, null, 2))

const annotatedVideoUrl = computed(() => {
  return resolveBackendFileUrl(
    result.value?.annotated_video_url || result.value?.output_video_url || ''
  )
})
const jsonUrl = computed(() => {
  return resolveBackendFileUrl(
    result.value?.json_url || result.value?.result_json_url || ''
  )
})
const reportUrl = computed(() => {
  return resolveBackendFileUrl(result.value?.report_url || '')
})
function stopPolling() {
  pollingActive.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startPolling() {
  stopPolling()
  pollingActive.value = true
  timer = setInterval(fetchTask, 3000)
}

function closeWs() {
  wsConnected.value = false
  if (wsRef.value) {
    wsRef.value.close()
    wsRef.value = null
  }
}

function redirectToResultOnce() {
  if (hasRedirected.value) return
  hasRedirected.value = true
  stopPolling()
  closeWs()
  router.replace(`/result/${taskId.value}`)
}

async function fetchTask() {
  try {
    const { data } = await getTask(taskId.value)
    task.value = data || {}

    if (String(data?.status || '').toLowerCase() === 'completed') {
      redirectToResultOnce()
    }

    if (String(data?.status || '').toLowerCase() === 'failed') {
      stopPolling()
      closeWs()
    }
  } catch (error) {
    fatalError.value =
      error?.response?.data?.detail ||
      error?.message ||
      '获取任务失败'
  }
}

function connectWs() {
  try {
    const wsUrl = getTaskWsUrl(taskId.value)
    wsRef.value = new WebSocket(wsUrl)

    wsRef.value.onopen = () => {
      wsConnected.value = true
    }

    wsRef.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        task.value = {
          ...(task.value || {}),
          ...(data || {})
        }

        const nextStatus = String(data?.status || '').toLowerCase()
        if (nextStatus === 'completed') {
          redirectToResultOnce()
        }
        if (nextStatus === 'failed') {
          stopPolling()
          closeWs()
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error)
      }
    }

    wsRef.value.onerror = () => {
      wsConnected.value = false
    }

    wsRef.value.onclose = () => {
      wsConnected.value = false
    }
  } catch (error) {
    console.error('创建 WebSocket 失败:', error)
  }
}

function goHome() {
  router.push('/')
}

function goResult() {
  router.push(`/result/${taskId.value}`)
}

onMounted(async () => {
  await fetchTask()

  if (status.value !== 'completed' && status.value !== 'failed') {
    connectWs()
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
  closeWs()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f8fb;
}
.card {
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}
.header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.section {
  margin-bottom: 20px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.muted {
  color: #64748b;
}
.code {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 12px;
  overflow: auto;
}
</style>