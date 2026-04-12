<template>
  <div class="online-page">
    <el-card class="panel">
      <template #header>
        <div class="header-row">
          <span class="title">在线解析</span>
          <span class="task-id">任务ID：{{ taskId }}</span>
        </div>
      </template>

      <div class="status-block">
        <el-progress :percentage="progress" :status="progressStatus" />
        <p class="message-text">{{ message }}</p>
        <p class="frame-text">当前帧：{{ currentFrame }} / {{ totalFrames || '-' }}</p>
      </div>

      <div v-if="showRealtime" class="realtime-section">
        <h3>实时检测画面</h3>
        <div class="realtime-box">
          <img
            :src="streamUrl"
            class="realtime-image"
            alt="实时检测流"
            @load="handleStreamLoad"
            @error="handleStreamError"
          />
        </div>
      </div>

      <div v-if="videoUrl && !showRealtime" class="video-section">
        <h3>最终标注结果视频</h3>
        <video
          :src="videoUrl"
          controls
          preload="metadata"
          class="result-video"
        />
      </div>

      <div class="stats-section">
        <h3>病害统计</h3>
        <div v-if="statList.length > 0" class="stats-list">
          <div
            v-for="item in statList"
            :key="item.name"
            class="stat-item"
          >
            <span>{{ item.name }}</span>
            <span>{{ item.count }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无统计数据" />
      </div>

      <div class="table-section">
        <h3>当前帧检测结果</h3>
        <el-table :data="detections" border style="width: 100%">
          <el-table-column prop="class_name" label="病害类型" min-width="160" />
          <el-table-column label="置信度" min-width="120">
            <template #default="scope">
              {{ formatConfidence(scope.row.confidence) }}
            </template>
          </el-table-column>
          <el-table-column label="边界框" min-width="260">
            <template #default="scope">
              {{ formatBbox(scope.row.bbox) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="status === 'completed'" class="action-row">
        <el-button
          v-if="reportUrl"
          type="primary"
          @click="openUrl(reportUrl)"
        >
          查看报告
        </el-button>

        <el-button
          v-if="jsonUrl"
          @click="openUrl(jsonUrl)"
        >
          查看 JSON
        </el-button>
      </div>

      <div v-if="status === 'failed'" class="failed-row">
        <el-alert
          title="任务执行失败"
          :description="message"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const taskId = route.params.taskId

const progress = ref(0)
const currentFrame = ref(0)
const totalFrames = ref(0)
const detections = ref([])
const statistics = ref({})
const message = ref('等待任务开始')
const status = ref('processing')

const videoUrl = ref('')
const reportUrl = ref('')
const jsonUrl = ref('')

const showRealtime = ref(true)
const ws = ref(null)
const hideRealtimeTimer = ref(null)

const progressStatus = computed(() => {
  if (status.value === 'failed') return 'exception'
  if (status.value === 'completed') return 'success'
  return ''
})

const statList = computed(() => {
  return Object.entries(statistics.value || {}).map(([name, count]) => ({
    name,
    count
  }))
})

const streamUrl = computed(() => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return `${apiBase}/api/stream/${taskId}`
})

function getWsBaseUrl() {
  const envWs = import.meta.env.VITE_WS_BASE_URL
  if (envWs) return envWs

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (apiBase.startsWith('https://')) {
    return apiBase.replace(/^https:\/\//, 'wss://')
  }
  return apiBase.replace(/^http:\/\//, 'ws://')
}

function formatConfidence(value) {
  return Number(value || 0).toFixed(2)
}

function formatBbox(bbox) {
  if (!Array.isArray(bbox)) return '-'
  return `[${bbox.join(', ')}]`
}

function openUrl(url) {
  window.open(url, '_blank')
}

function handleStreamLoad() {
  console.log('MJPEG stream loaded:', streamUrl.value)
}

function handleStreamError(event) {
  console.error('MJPEG stream error:', event)
}

async function fetchResult() {
  try {
    const res = await request({
      url: `/api/result/${taskId}`,
      method: 'get'
    })

    videoUrl.value = res.annotated_video_url || ''
    reportUrl.value = res.report_url || ''
    jsonUrl.value = res.json_url || ''
    status.value = res.status || 'completed'

    console.log('fetchResult success:', res)
  } catch (error) {
    console.error('获取结果失败:', error)
    ElMessage.error(error.message || '获取结果失败')
  }
}

async function fetchTaskStatus() {
  try {
    const res = await request({
      url: `/api/task/${taskId}`,
      method: 'get'
    })

    if (!res) return

    status.value = res.status || status.value
    progress.value = Number(res.progress || 0)
    message.value = res.message || message.value

    console.log('fetchTaskStatus:', res)

    if (res.status === 'completed') {
      await fetchResult()

      if (!hideRealtimeTimer.value) {
        hideRealtimeTimer.value = setTimeout(() => {
          showRealtime.value = false
        }, 5000)
      }
    }

    if (res.status === 'failed') {
      showRealtime.value = false
    }
  } catch (error) {
    console.error('获取任务状态失败:', error)
  }
}

function connectWebSocket() {
  const wsBase = getWsBaseUrl()
  const wsUrl = `${wsBase}/ws/${taskId}`

  console.log('taskId:', taskId)
  console.log('streamUrl:', streamUrl.value)
  console.log('wsUrl:', wsUrl)

  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    console.log('WebSocket connected')
  }

  ws.value.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('ws data:', data)

      if (data.type === 'progress') {
        progress.value = Number(data.progress ?? 0)
        currentFrame.value = Number(data.current_frame ?? 0)
        totalFrames.value = Number(data.total_frames ?? 0)
        detections.value = Array.isArray(data.detections) ? data.detections : []
        statistics.value = data.statistics || {}
        message.value = data.message || '正在处理视频'
        status.value = 'processing'
        return
      }

      if (data.type === 'completed') {
        progress.value = 100
        currentFrame.value = Number(data.current_frame ?? currentFrame.value)
        totalFrames.value = Number(data.total_frames ?? totalFrames.value)
        message.value = data.message || '检测完成'
        statistics.value = data.statistics || statistics.value
        status.value = 'completed'

        await fetchResult()

        if (!hideRealtimeTimer.value) {
          hideRealtimeTimer.value = setTimeout(() => {
            showRealtime.value = false
          }, 5000)
        }

        return
      }

      if (data.type === 'failed') {
        status.value = 'failed'
        message.value = data.message || '任务失败'
        showRealtime.value = false
        ElMessage.error(message.value)
      }
    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error)
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.value.onclose = () => {
    console.log('WebSocket closed')
  }
}

onMounted(async () => {
  showRealtime.value = true
  await fetchTaskStatus()
  connectWebSocket()
})

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close()
  }

  if (hideRealtimeTimer.value) {
    clearTimeout(hideRealtimeTimer.value)
    hideRealtimeTimer.value = null
  }
})
</script>

<style scoped>
.online-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.panel {
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 12px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.task-id {
  color: #606266;
  font-size: 14px;
  word-break: break-all;
}

.status-block {
  margin-bottom: 20px;
}

.message-text {
  margin: 12px 0 6px;
  color: #606266;
}

.frame-text {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.realtime-section,
.video-section,
.stats-section,
.table-section,
.action-row,
.failed-row {
  margin-top: 24px;
}

.realtime-box {
  width: 100%;
  min-height: 360px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.realtime-image {
  width: 100%;
  display: block;
  background: #000;
}

.result-video {
  width: 100%;
  max-height: 560px;
  background: #000;
  border-radius: 8px;
  outline: none;
}

.stats-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
}

.action-row {
  display: flex;
  gap: 12px;
}
</style>