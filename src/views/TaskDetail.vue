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
          <el-button
            type="primary"
            @click="scrollToResult"
            :disabled="status !== 'completed'"
          >
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
        style="margin-bottom: 16px"
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

      <div
        v-if="status === 'completed'"
        ref="resultSectionRef"
        class="section result-section"
      >
        <div class="section-header">
          <h3>分析结果</h3>
          <el-button
            v-if="!resultLoading"
            @click="fetchResult"
          >
            刷新结果
          </el-button>
        </div>

        <el-skeleton v-if="resultLoading" :rows="4" animated />

        <el-alert
          v-else-if="resultError"
          :title="resultError"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />

        <template v-else>
          <div v-if="hasAnyResultFile" class="result-files">
            <div class="file-item">
              <div class="file-info">
                <div class="file-title">标注视频</div>
                <div class="file-url">{{ annotatedVideoUrl || '暂无' }}</div>
              </div>
              <div class="file-actions">
                <el-button
                  type="primary"
                  :disabled="!annotatedVideoUrl"
                  @click="openPreview('video')"
                >
                  查看
                </el-button>
                <el-button
                  :disabled="!annotatedVideoUrl"
                  @click="downloadFile(annotatedVideoUrl, 'annotated-video.mp4')"
                >
                  下载
                </el-button>
              </div>
            </div>

            <div class="file-item">
              <div class="file-info">
                <div class="file-title">JSON 结果</div>
                <div class="file-url">{{ jsonUrl || '暂无' }}</div>
              </div>
              <div class="file-actions">
                <el-button
                  type="primary"
                  :disabled="!jsonUrl"
                  @click="openPreview('json')"
                >
                  查看
                </el-button>
                <el-button
                  :disabled="!jsonUrl"
                  @click="downloadFile(jsonUrl, 'result.json')"
                >
                  下载
                </el-button>
              </div>
            </div>

            <div class="file-item">
              <div class="file-info">
                <div class="file-title">HTML 报告</div>
                <div class="file-url">{{ reportUrl || '暂无' }}</div>
              </div>
              <div class="file-actions">
                <el-button
                  type="primary"
                  :disabled="!reportUrl"
                  @click="openPreview('html')"
                >
                  查看
                </el-button>
                <el-button
                  :disabled="!reportUrl"
                  @click="downloadFile(reportUrl, 'report.html')"
                >
                  下载
                </el-button>
              </div>
            </div>
          </div>

          <el-empty
            v-else
            description="任务已完成，但暂未获取到结果文件"
          />

          <div class="section" style="margin-top: 20px">
            <h3>结果原始数据</h3>
            <pre class="code">{{ prettyResult }}</pre>
          </div>
        </template>
      </div>

      <div class="section">
        <h3>原始任务数据</h3>
        <pre class="code">{{ prettyTask }}</pre>
      </div>
    </div>

    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div v-if="previewType === 'video'" class="preview-box">
        <video
          :src="previewUrl"
          controls
          style="width: 100%; max-height: 70vh"
        />
      </div>

      <div v-else-if="previewType === 'json'" class="preview-box">
        <pre class="json-preview">{{ previewJsonText }}</pre>
      </div>

      <div v-else-if="previewType === 'html'" class="preview-box">
        <iframe
          :src="previewUrl"
          class="report-frame"
          title="HTML报告预览"
        />
      </div>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!previewUrl"
          @click="downloadFile(previewUrl, previewDownloadName)"
        >
          下载当前文件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getTask,
  getTaskWsUrl,
  getResult,
  resolveBackendFileUrl
} from '@/api'

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
const result = ref({})
const fatalError = ref('')
const resultError = ref('')
const resultLoading = ref(false)

const wsRef = ref(null)
const wsConnected = ref(false)
const pollingActive = ref(false)

const resultSectionRef = ref(null)

const previewVisible = ref(false)
const previewType = ref('')
const previewTitle = ref('')
const previewUrl = ref('')
const previewJsonText = ref('')
const previewDownloadName = ref('')

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
const prettyResult = computed(() => JSON.stringify(result.value || {}, null, 2))

const annotatedVideoUrl = computed(() => {
  return resolveBackendFileUrl(
    result.value?.annotated_video_url ||
      result.value?.output_video_url ||
      result.value?.video_url ||
      ''
  )
})

const jsonUrl = computed(() => {
  return resolveBackendFileUrl(
    result.value?.json_url ||
      result.value?.result_json_url ||
      result.value?.output_json_url ||
      ''
  )
})

const reportUrl = computed(() => {
  return resolveBackendFileUrl(
    result.value?.report_url ||
      result.value?.html_report_url ||
      result.value?.report_html_url ||
      ''
  )
})

const hasAnyResultFile = computed(() => {
  return Boolean(annotatedVideoUrl.value || jsonUrl.value || reportUrl.value)
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

async function fetchResult() {
  if (!taskId.value) return

  resultLoading.value = true
  resultError.value = ''

  try {
    const { data } = await getResult(taskId.value)
    result.value = data || {}
  } catch (error) {
    resultError.value =
      error?.response?.data?.detail ||
      error?.message ||
      '获取结果失败'
  } finally {
    resultLoading.value = false
  }
}

async function fetchTask() {
  try {
    const { data } = await getTask(taskId.value)
    task.value = data || {}

    const nextStatus = String(data?.status || '').toLowerCase()

    if (nextStatus === 'completed') {
      stopPolling()
      closeWs()
      await fetchResult()
    }

    if (nextStatus === 'failed') {
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

    wsRef.value.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        task.value = {
          ...(task.value || {}),
          ...(data || {})
        }

        const nextStatus = String(data?.status || '').toLowerCase()

        if (nextStatus === 'completed') {
          stopPolling()
          closeWs()
          await fetchResult()
          await nextTick()
          scrollToResult()
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

function scrollToResult() {
  nextTick(() => {
    resultSectionRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  })
}

async function openPreview(type) {
  previewType.value = type
  previewJsonText.value = ''

  if (type === 'video') {
    previewTitle.value = '预览标注视频'
    previewUrl.value = annotatedVideoUrl.value
    previewDownloadName.value = 'annotated-video.mp4'
  } else if (type === 'json') {
    previewTitle.value = '预览 JSON 结果'
    previewUrl.value = jsonUrl.value
    previewDownloadName.value = 'result.json'
  } else if (type === 'html') {
    previewTitle.value = '预览 HTML 报告'
    previewUrl.value = reportUrl.value
    previewDownloadName.value = 'report.html'
  } else {
    return
  }

  if (!previewUrl.value) {
    ElMessage.warning('文件地址不存在')
    return
  }

  previewVisible.value = true

  if (type === 'json') {
    try {
      const response = await fetch(previewUrl.value)
      const data = await response.json()
      previewJsonText.value = JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('加载 JSON 失败:', error)
      previewJsonText.value = 'JSON 加载失败'
    }
  }
}

function downloadFile(url, filename = '') {
  if (!url) {
    ElMessage.warning('文件地址不存在')
    return
  }

  const a = document.createElement('a')
  a.href = url
  a.download = filename || ''
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(async () => {
  await fetchTask()

  if (status.value === 'completed') {
    await fetchResult()
    return
  }

  if (status.value !== 'failed') {
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.result-section {
  padding: 20px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.result-files {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.file-info {
  flex: 1;
  min-width: 240px;
}

.file-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.file-url {
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
}

.file-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-box {
  width: 100%;
}

.json-preview {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 12px;
  overflow: auto;
  max-height: 70vh;
  white-space: pre-wrap;
  word-break: break-word;
}

.report-frame {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
  background: #fff;
}
</style>