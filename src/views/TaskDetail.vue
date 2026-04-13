<template>
  <MainLayout>
    <PageContainer>
      <div class="theme-page">
        <section class="theme-hero">
          <div class="theme-hero__main">
            <div class="theme-badge">Task Monitoring Workspace</div>
            <h1 class="theme-title">任务详情</h1>
            <p class="theme-desc">
              实时查看任务执行状态、检测进度、连接方式、实时预览和输出文件。
              整体视觉与 detect 页统一，重点突出“当前正在发生什么”。
            </p>

            <div class="theme-chip-row">
              <span class="theme-chip">任务 ID：{{ taskId }}</span>
              <span class="theme-chip">状态：{{ status || 'queued' }}</span>
              <span class="theme-chip">连接：{{ connectionLabel }}</span>
            </div>

            <div class="theme-hero__actions">
              <el-button @click="goHome">返回首页</el-button>
              <el-button @click="goOnline">新建在线任务</el-button>
              <el-button @click="goOffline">新建离线任务</el-button>
              <el-button type="primary" :disabled="!taskStore.isCompleted" @click="goResult">
                查看结果页
              </el-button>
            </div>
          </div>

          <div class="theme-hero__side">
            <div class="theme-panel__head">当前任务状态</div>
            <p class="theme-panel__sub">{{ message }}</p>

            <div class="theme-summary">
              <div class="theme-summary__row">
                <span class="theme-summary__label">任务状态</span>
                <span class="theme-summary__value">
                  <StatusTag :status="status" />
                </span>
              </div>
              <div class="theme-summary__row">
                <span class="theme-summary__label">连接方式</span>
                <span class="theme-summary__value">
                  <el-tag :type="connectionTagType" round>
                    {{ connectionLabel }}
                  </el-tag>
                </span>
              </div>
              <div class="theme-summary__row">
                <span class="theme-summary__label">实时连接说明</span>
                <span class="theme-summary__value">{{ connectionDescription }}</span>
              </div>
            </div>
          </div>
        </section>

        <div v-if="fatalError" style="margin-bottom: 24px;">
          <ErrorState
            title="任务加载失败"
            :description="fatalError"
            @retry="initializeTask"
            @back="goHome"
          />
        </div>

        <template v-else>
          <div class="theme-grid-three">
            <div class="theme-metric-card">
              <span class="theme-metric-card__label">任务进度</span>
              <strong class="theme-metric-card__value">{{ normalizedProgress }}%</strong>
            </div>
            <div class="theme-metric-card">
              <span class="theme-metric-card__label">当前帧</span>
              <strong class="theme-metric-card__value">{{ currentFrame > 0 ? currentFrame : '-' }}</strong>
            </div>
            <div class="theme-metric-card">
              <span class="theme-metric-card__label">总帧数</span>
              <strong class="theme-metric-card__value">{{ totalFrames > 0 ? totalFrames : '-' }}</strong>
            </div>
          </div>

          <section class="theme-grid-two">
            <div class="theme-panel">
              <div class="theme-panel__head">进度与连接</div>
              <p class="theme-panel__sub">优先使用 WebSocket，失败时自动降级为轮询。</p>

              <div class="theme-progress-track">
                <div
                  class="theme-progress-fill"
                  :style="{ width: `${normalizedProgress}%` }"
                ></div>
              </div>

              <div class="theme-chip-row" style="margin-bottom: 18px;">
                <span class="theme-chip">状态：{{ status }}</span>
                <span class="theme-chip">检测数：{{ detections.length }}</span>
                <span class="theme-chip">统计项：{{ statList.length }}</span>
              </div>

              <div class="theme-summary">
                <div class="theme-summary__row">
                  <span class="theme-summary__label">WebSocket</span>
                  <span class="theme-summary__value">
                    <el-tag :type="wsConnected ? 'success' : 'info'" round>
                      {{ wsConnected ? '已连接' : '未连接' }}
                    </el-tag>
                  </span>
                </div>
                <div class="theme-summary__row">
                  <span class="theme-summary__label">轮询兜底</span>
                  <span class="theme-summary__value">
                    <el-tag :type="pollingActive ? 'warning' : 'info'" round>
                      {{ pollingActive ? '运行中' : '未启用' }}
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>

            <div class="theme-panel">
              <div class="theme-panel__head">实时检测预览</div>
              <p class="theme-panel__sub">在线任务支持实时画面流，离线任务则根据能力回退显示。</p>

              <div class="theme-preview">
                <template v-if="canShowRealtime">
                  <img
                    :src="streamUrl"
                    alt="实时检测流"
                    @error="handleStreamError"
                  />
                </template>

                <template v-else>
                  <div style="width: 100%; padding: 20px;">
                    <EmptyState
                      title="暂无实时画面"
                      :description="previewDescription"
                    />
                  </div>
                </template>
              </div>
            </div>
          </section>

          <section class="theme-grid-two">
            <div class="theme-panel">
              <div class="theme-panel__head">病害统计</div>
              <p class="theme-panel__sub">根据实时状态或最终结果汇总病害类别信息。</p>

              <div v-if="statList.length > 0" class="theme-list">
                <div
                  v-for="item in statList"
                  :key="item.name"
                  class="theme-list-item"
                >
                  <span class="theme-list-item__title">{{ item.name }}</span>
                  <span class="theme-list-item__value">{{ item.count }}</span>
                </div>
              </div>

              <EmptyState
                v-else
                title="暂无统计数据"
                description="任务执行后将逐步展示病害统计信息。"
              />
            </div>

            <div class="theme-panel">
              <div class="theme-panel__head">任务输出</div>
              <p class="theme-panel__sub">任务完成后，可在此查看报告与结果文件。</p>

              <div
                v-if="result?.report_url || result?.json_url || result?.annotated_video_url || taskStore.isCompleted"
                class="theme-hero__actions"
              >
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

              <EmptyState
                v-else
                title="暂无输出文件"
                description="任务尚未完成，结果文件会在完成后出现在这里。"
              />
            </div>
          </section>

          <section class="theme-panel soft-table">
            <div class="theme-panel__head">当前检测明细</div>
            <p class="theme-panel__sub">显示当前帧或当前阶段返回的检测结果。</p>

            <template v-if="detections.length > 0">
              <el-table :data="detections" stripe style="width: 100%">
                <el-table-column prop="class_name" label="病害类型" min-width="180" />
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
          </section>
        </template>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask, getTaskWsUrl } from '@/api'

const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId

const task = ref(null)
const ws = ref(null)
let timer = null

async function fetchTask() {
  try {
    const { data } = await getTask(taskId)
    task.value = data

    if (data.status === 'completed') {
      stopPolling()
    }
  } catch (error) {
    console.error('获取任务失败:', error)
  }
}

function startPolling() {
  stopPolling()
  timer = setInterval(fetchTask, 3000)
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function connectWs() {
  try {
    ws.value = new WebSocket(getTaskWsUrl(taskId))

    ws.value.onopen = () => {
      console.log('WebSocket 已连接')
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        task.value = {
          ...task.value,
          ...data
        }

        if (data.status === 'completed') {
          stopPolling()
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket 错误:', error)
    }

    ws.value.onclose = () => {
      console.log('WebSocket 已关闭，继续使用轮询')
    }
  } catch (error) {
    console.error('创建 WebSocket 失败:', error)
  }
}

function closeWs() {
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
}

function goResult() {
  router.push(`/result/${taskId}`)
}

onMounted(async () => {
  await fetchTask()
  connectWs()
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
  closeWs()
})
</script>
