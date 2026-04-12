<template>
  <MainLayout>
    <PageContainer>
      <div class="task-detail-page">
        <section class="page-hero">
          <div class="page-hero__main">
            <div class="page-hero__badge">Task Monitoring Workspace</div>
            <h1 class="page-hero__title">任务详情</h1>
            <p class="page-hero__desc">
              实时查看任务执行状态、检测进度、统计信息和输出结果。
              当前页面统一承接在线分析与离线分析两种模式。
            </p>

            <div class="page-hero__meta">
              <div class="meta-item">
                <span class="meta-item__label">任务 ID</span>
                <span class="meta-item__value">{{ taskId }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-item__label">当前状态</span>
                <StatusTag :status="status" />
              </div>
              <div class="meta-item">
                <span class="meta-item__label">连接方式</span>
                <el-tag :type="connectionTagType" round>
                  {{ connectionLabel }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="page-hero__side">
            <SectionCard title="任务操作" description="根据任务状态进行下一步操作。">
              <div class="action-list">
                <el-button @click="goHome">返回首页</el-button>
                <el-button @click="goOnline">新建在线任务</el-button>
                <el-button @click="goOffline">新建离线任务</el-button>
                <el-button
                  type="primary"
                  :disabled="!taskStore.isCompleted"
                  @click="goResult"
                >
                  查看结果页
                </el-button>
              </div>
            </SectionCard>
          </div>
        </section>

        <div v-if="fatalError" class="section-gap">
          <ErrorState
            title="任务加载失败"
            :description="fatalError"
            @retry="initializeTask"
            @back="goHome"
          />
        </div>

        <template v-else>
          <div class="dashboard-grid section-gap">
            <SectionCard
              title="任务进度"
              description="显示当前任务状态、处理进度和阶段提示。"
            >
              <div class="progress-panel">
                <div class="progress-panel__top">
                  <div>
                    <div class="progress-panel__title-row">
                      <StatusTag :status="status" />
                      <span class="progress-panel__message">{{ message }}</span>
                    </div>
                    <div class="progress-panel__sub">
                      当前帧：{{ currentFrame }} /
                      {{ totalFrames > 0 ? totalFrames : '-' }}
                    </div>
                  </div>

                  <div class="progress-panel__percent">
                    {{ normalizedProgress }}%
                  </div>
                </div>

                <el-progress
                  :percentage="normalizedProgress"
                  :status="progressBarStatus"
                  :stroke-width="16"
                />

                <div class="progress-hints">
                  <el-tag effect="plain">状态：{{ status }}</el-tag>
                  <el-tag effect="plain">检测数：{{ detections.length }}</el-tag>
                  <el-tag effect="plain">统计项：{{ statList.length }}</el-tag>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="连接状态"
              description="优先使用 WebSocket，失败时自动降级为轮询。"
            >
              <div class="connection-panel">
                <div class="connection-row">
                  <span>WebSocket</span>
                  <el-tag :type="wsConnected ? 'success' : 'info'" round>
                    {{ wsConnected ? '已连接' : '未连接' }}
                  </el-tag>
                </div>
                <div class="connection-row">
                  <span>轮询兜底</span>
                  <el-tag :type="pollingActive ? 'warning' : 'info'" round>
                    {{ pollingActive ? '运行中' : '未启用' }}
                  </el-tag>
                </div>
                <div class="connection-row">
                  <span>当前模式</span>
                  <el-tag :type="connectionTagType" round>
                    {{ connectionLabel }}
                  </el-tag>
                </div>
                <div class="connection-desc">
                  {{ connectionDescription }}
                </div>
              </div>
            </SectionCard>
          </div>

          <div class="content-grid section-gap">
            <SectionCard
              title="实时检测预览"
              description="在线任务支持实时画面流，离线任务若无实时流则显示提示。"
            >
              <div class="preview-box">
                <template v-if="canShowRealtime">
                  <img
                    :src="streamUrl"
                    class="preview-image"
                    alt="实时检测流"
                    @error="handleStreamError"
                  />
                </template>

                <template v-else>
                  <EmptyState
                    title="暂无实时画面"
                    :description="previewDescription"
                  />
                </template>
              </div>
            </SectionCard>

            <SectionCard
              title="病害统计"
              description="根据实时状态或最终结果汇总病害类别信息。"
            >
              <div v-if="statList.length > 0" class="stat-grid">
                <div
                  v-for="item in statList"
                  :key="item.name"
                  class="stat-card"
                >
                  <div class="stat-card__name">{{ item.name }}</div>
                  <div class="stat-card__value">{{ item.count }}</div>
                </div>
              </div>

              <EmptyState
                v-else
                title="暂无统计数据"
                description="任务执行后将逐步展示病害统计信息。"
              />
            </SectionCard>
          </div>

          <div class="section-gap">
            <SectionCard
              title="当前检测明细"
              description="显示当前帧或当前阶段返回的检测结果。"
            >
              <template v-if="detections.length > 0">
                <el-table :data="detections" border stripe style="width: 100%">
                  <el-table-column
                    prop="class_name"
                    label="病害类型"
                    min-width="180"
                  />

                  <el-table-column label="置信度" min-width="120">
                    <template #default="{ row }">
                      {{ formatConfidence(row.confidence) }}
                    </template>
                  </el-table-column>

                  <el-table-column label="边界框" min-width="260">
                    <template #default="{ row }">
                      {{ formatBbox(row.bbox) }}
                    </template>
                  </el-table-column>
                </el-table>
              </template>

              <EmptyState
                v-else
                title="暂无检测结果"
                description="任务正在初始化或当前阶段尚未返回检测明细。"
              />
            </SectionCard>
          </div>

          <div class="section-gap">
            <SectionCard
              title="任务输出"
              description="任务完成后，可在此查看报告与结果文件。"
            >
              <div class="result-actions">
                <el-button
                  type="primary"
                  :disabled="!taskStore.isCompleted"
                  @click="goResult"
                >
                  打开结果页
                </el-button>

                <el-button
                  v-if="result?.report_url"
                  @click="openExternal(result.report_url)"
                >
                  查看 HTML 报告
                </el-button>

                <el-button
                  v-if="result?.json_url"
                  @click="openExternal(result.json_url)"
                >
                  查看 JSON
                </el-button>

                <el-button
                  v-if="result?.annotated_video_url"
                  @click="openExternal(result.annotated_video_url)"
                >
                  查看标注视频
                </el-button>
              </div>
            </SectionCard>
          </div>
        </template>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

import { useTaskStore } from '@/stores/task'
import { useTaskPolling } from '@/composables/useTaskPolling'
import { useTaskWebSocket } from '@/composables/useTaskWebSocket'
import { useTaskStream } from '@/composables/useTaskStream'
import { useTaskResult } from '@/composables/useTaskResult'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const fatalError = ref('')

const taskId = computed(() => String(route.params.taskId || ''))

const status = computed(() => taskStore.status)
const message = computed(() => taskStore.message || '正在初始化任务...')
const currentFrame = computed(() => taskStore.currentFrame)
const totalFrames = computed(() => taskStore.totalFrames)
const detections = computed(() => taskStore.detections)
const statList = computed(() => taskStore.statList)
const normalizedProgress = computed(() => taskStore.normalizedProgress)
const result = computed(() => taskStore.result)
const wsConnected = computed(() => taskStore.wsConnected)
const pollingActive = computed(() => taskStore.pollingActive)

const progressBarStatus = computed(() => {
  if (taskStore.isFailed) return 'exception'
  if (taskStore.isCompleted) return 'success'
  return ''
})

const connectionLabel = computed(() => {
  if (taskStore.wsConnected) return 'WebSocket 实时推送'
  if (taskStore.pollingActive) return '轮询兜底'
  return '初始化中'
})

const connectionTagType = computed(() => {
  if (taskStore.wsConnected) return 'success'
  if (taskStore.pollingActive) return 'warning'
  return 'info'
})

const connectionDescription = computed(() => {
  if (taskStore.wsConnected) {
    return '当前通过 WebSocket 接收任务实时状态更新。'
  }
  if (taskStore.pollingActive) {
    return '当前 WebSocket 不可用，系统已自动切换为轮询模式。'
  }
  return '正在初始化任务连接方式。'
})

const {
  previewAvailable,
  streamUrl,
  handleStreamError,
  resetStreamState
} = useTaskStream(taskId)

const canShowRealtime = computed(() => {
  if (!previewAvailable.value) return false
  return !taskStore.isFailed && !taskStore.isCompleted
})

const previewDescription = computed(() => {
  if (!previewAvailable.value) {
    return '实时流不可用，可能当前任务不提供该能力或流已中断。'
  }
  if (taskStore.isCompleted) {
    return '任务已完成，请前往结果页查看最终输出。'
  }
  if (taskStore.isFailed) {
    return '任务执行失败，无法展示实时预览。'
  }
  return '当前暂无可展示的实时画面。'
})

const { fetchResult } = useTaskResult(taskId)

const {
  fetchOnce,
  startPolling,
  startWithImmediateFetch,
  stopPolling
} = useTaskPolling(taskId, {
  interval: 3000,
  onCompleted: async () => {
    await fetchResult(true)
  },
  onFailed: async () => {}
})

const { connectWebSocket, closeWebSocket } = useTaskWebSocket(taskId, {
  onOpen: () => {
    stopPolling()
  },
  onCompleted: async () => {
    await fetchResult(true)
    stopPolling()
  },
  onFailed: async () => {
    startPolling()
  },
  onError: () => {
    startPolling()
  },
  onClose: () => {
    if (!taskStore.isCompleted && !taskStore.isFailed) {
      startPolling()
    }
  }
})

function goHome() {
  router.push('/')
}

function goOnline() {
  router.push('/detect/online')
}

function goOffline() {
  router.push('/detect/offline')
}

function goResult() {
  router.push(`/result/${taskId.value}`)
}

function openExternal(url) {
  if (!url) return
  window.open(url, '_blank')
}

function formatConfidence(value) {
  const n = Number(value || 0)
  return n.toFixed(2)
}

function formatBbox(bbox) {
  if (!Array.isArray(bbox)) return '-'
  return `[${bbox.join(', ')}]`
}

async function initializeTask() {
  fatalError.value = ''
  resetStreamState()

  taskStore.resetTask()
  taskStore.setTask({
    taskId: taskId.value,
    status: 'queued'
  })

  try {
    const res = await startWithImmediateFetch()

    if (!['completed', 'success', 'failed', 'error'].includes(res?.status)) {
      connectWebSocket()
    }
  } catch (error) {
    fatalError.value = error?.message || '初始化任务失败'
  }
}

watch(
  () => taskId.value,
  async () => {
    closeWebSocket()
    stopPolling()
    await initializeTask()
  }
)

onMounted(async () => {
  await initializeTask()
})

onBeforeUnmount(() => {
  closeWebSocket()
  stopPolling()
})
</script>

<style scoped>
.task-detail-page {
  padding: 28px 0 40px;
}

.page-hero {
  display: grid;
  grid-template-columns: 1.35fr 0.8fr;
  gap: 20px;
  align-items: start;
}

.page-hero__main {
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
  color: #fff;
}

.page-hero__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.18);
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 600;
}

.page-hero__title {
  margin: 18px 0 10px;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
}

.page-hero__desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.78);
}

.page-hero__meta {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
}

.meta-item__label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.meta-item__value {
  font-size: 13px;
  color: #fff;
  word-break: break-all;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-gap {
  margin-top: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 20px;
}

.progress-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-panel__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.progress-panel__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.progress-panel__message {
  font-size: 14px;
  color: #334155;
}

.progress-panel__sub {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

.progress-panel__percent {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}

.progress-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.connection-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.connection-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #334155;
}

.connection-desc {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  line-height: 1.8;
  font-size: 13px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 20px;
}

.preview-box {
  min-height: 320px;
  border-radius: 18px;
  overflow: hidden;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  display: block;
  background: #000;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
}

.stat-card__name {
  font-size: 14px;
  color: #64748b;
}

.stat-card__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 1100px) {
  .page-hero,
  .dashboard-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .task-detail-page {
    padding-top: 20px;
  }

  .page-hero__main {
    padding: 20px;
  }

  .page-hero__title {
    font-size: 28px;
  }

  .progress-panel__top {
    flex-direction: column;
  }

  .action-list {
    width: 100%;
  }

  .action-list .el-button {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions .el-button {
    width: 100%;
  }
}
</style>