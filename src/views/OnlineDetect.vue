<template>
  <div class="online-page">
    <el-card class="panel">
      <template #header>
        <div class="header-row">
          <div class="left">
            <el-button icon="ArrowLeft" circle @click="$router.push('/')" style="margin-right: 10px;" />
            <span class="title">在线检测任务</span>
          </div>
          <el-tag type="info">任务ID：{{ taskId }}</el-tag>
        </div>
      </template>

      <div class="status-block">
        <el-progress
          :percentage="progress"
          :status="progress === 100 ? 'success' : ''"
          :stroke-width="20"
          striped
          striped-flow
        />
        <div class="status-info">
          <p class="message-text"><el-icon v-if="progress < 100"><Loading /></el-icon> {{ message }}</p>
          <p class="frame-text">处理进度：{{ currentFrame }} / {{ totalFrames || '-' }} 帧</p>
        </div>
      </div>

      <el-row :gutter="20">
        <el-col :span="14">
          <div v-if="showRealtime" class="display-section">
            <h3 class="section-title">实时检测流</h3>
            <div class="media-box realtime-bg">
              <img :src="streamUrl" class="media-content" alt="实时画面" @error="handleStreamError" />
            </div>
          </div>

          <div v-if="videoUrl && !showRealtime" class="display-section">
            <h3 class="section-title">检测结果视频</h3>
            <div class="media-box">
              <video :src="videoUrl" controls class="media-content" />
            </div>
          </div>
        </el-col>

        <el-col :span="10">
          <div class="stats-section">
            <h3 class="section-title">病害实时统计</h3>
            <ResultChart :summary="statistics" style="margin-bottom: 20px;" />
            <ResultTable :rows="detections" />
          </div>
        </el-col>
      </el-row>

      <transition name="el-zoom-in-top">
        <div v-if="progress === 100" class="storage-section">
          <el-divider><el-icon><FolderChecked /></el-icon> 数据持久化存档</el-divider>
          <div class="storage-buttons">
            <el-button type="primary" plain @click="openStorageFile('result.json')">
              查看检测报告 (result.json)
            </el-button>
            <el-button type="info" plain @click="openStorageFile('meta.json')">
              查看任务配置 (meta.json)
            </el-button>
            <el-button type="success" plain @click="openStorageFile('output.mp4', 'outputs')">
              原始结果视频
            </el-button>
          </div>
          <p class="storage-tip">提示：数据已永久存储在后端服务器的 <code>/data/tasks/{{taskId}}</code> 目录下</p>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import { Loading, FolderChecked, ArrowLeft, Monitor } from '@element-plus/icons-vue'
import ResultChart from '../components/ResultChart.vue'
import ResultTable from '../components/ResultTable.vue'

const route = useRoute()
const taskId = route.params.taskId

// 状态变量
const progress = ref(0)
const message = ref('正在建立连接...')
const currentFrame = ref(0)
const totalFrames = ref(0)
const showRealtime = ref(true)
const detections = ref([])
const statistics = ref({})
const videoUrl = ref('')

let ws = null

// 基础 URL 处理
const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://road-damage-backend-1.onrender.com'
const streamUrl = `${apiBase}/api/stream/${taskId}`

// 计算 WebSocket 地址 (自动处理 http->ws, https->wss)
const wsUrl = computed(() => {
  const url = apiBase.replace(/^http/, 'ws')
  return `${url}/ws/${taskId}`
})

// 初始化 WebSocket
const initWebSocket = () => {
  ws = new WebSocket(wsUrl.value)

  ws.onopen = () => {
    console.log('WS Connected')
    message.value = '已连接到后端检测引擎'
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'progress') {
      progress.value = data.progress
      message.value = data.message
      currentFrame.value = data.current_frame
      totalFrames.value = data.total_frames
      detections.value = data.detections || []
      statistics.value = data.statistics || {}
    }
    else if (data.type === 'completed') {
      progress.value = 100
      message.value = '检测任务已完成，数据已持久化存储'
      showRealtime.value = false
      // 这里的路径对应后端 app.mount("/static/outputs")
      videoUrl.value = `${apiBase}/static/outputs/${taskId}/output.mp4`

      ElNotification({
        title: '任务完成',
        message: '检测结果已成功存储到服务器',
        type: 'success'
      })
    }
    else if (data.type === 'error') {
      message.value = '错误: ' + data.message
    }
  }

  ws.onerror = () => {
    message.value = 'WebSocket 连接失败，请检查后端状态'
  }
}

// 访问后端存储的文件
const openStorageFile = (fileName, type = 'tasks') => {
  // type='tasks' 对应 /static/tasks (meta/result)
  // type='outputs' 对应 /static/outputs (video/html)
  const url = `${apiBase}/static/${type}/${taskId}/${fileName}`
  window.open(url, '_blank')
}

const handleStreamError = () => {
  if (progress.value < 100) {
    message.value = '实时流传输中断，尝试重新连接...'
  }
}

onMounted(() => {
  initWebSocket()
})

onBeforeUnmount(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.online-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}
.panel {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 12px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-block {
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.status-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.message-text { font-weight: bold; color: #409EFF; margin: 0; }
.frame-text { color: #909399; font-size: 13px; margin: 0; }

.section-title {
  font-size: 16px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
  margin-bottom: 15px;
}

.media-box {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.realtime-bg {
  background: url('https://www.transparenttextures.com/patterns/black-thread.png') #1a1a1a;
}
.media-content {
  max-width: 100%;
  max-height: 100%;
}

.storage-section {
  margin-top: 40px;
  padding: 20px;
  background: #fdfdfd;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  text-align: center;
}
.storage-buttons {
  margin: 20px 0;
}
.storage-tip {
  font-size: 12px;
  color: #909399;
}
</style>