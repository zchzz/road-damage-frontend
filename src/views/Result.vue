<template>
  <MainLayout>
    <PageContainer>
      <div class="theme-page">
        <section class="theme-hero">
          <div class="theme-hero__main">
            <div class="theme-badge">Detection Result</div>
            <h1 class="theme-title">任务结果页</h1>
            <p class="theme-desc">
              统一承接检测统计、摘要信息、结果文件和明细表。
              视觉层和 detect / task 页面保持一致，只突出结果查看与导出。
            </p>

            <div class="theme-chip-row">
              <span class="theme-chip">任务 ID：{{ taskId }}</span>
              <span class="theme-chip">病害类别：{{ statList.length }}</span>
              <span class="theme-chip">检测明细：{{ detectionCount }}</span>
              <span class="theme-chip">结果文件：{{ fileCount }}</span>
            </div>
          </div>

          <div class="theme-hero__side">
            <div class="theme-panel__head">结果状态</div>
            <p class="theme-panel__sub">当前任务的最终汇总与下一步操作。</p>

            <div class="theme-summary">
              <div class="theme-summary__row">
                <span class="theme-summary__label">任务状态</span>
                <span class="theme-summary__value">
                  <StatusTag :status="status" />
                </span>
              </div>
              <div class="theme-summary__row">
                <span class="theme-summary__label">结果加载</span>
                <span class="theme-summary__value">{{ loading ? '加载中' : '已就绪' }}</span>
              </div>
            </div>

            <div class="theme-hero__actions">
              <el-button type="primary" @click="refreshResult">刷新结果</el-button>
              <el-button @click="goTaskDetail">返回任务页</el-button>
              <el-button @click="goHome">返回首页</el-button>
            </div>
          </div>
        </section>

        <div class="theme-grid-three">
          <div class="theme-metric-card">
            <span class="theme-metric-card__label">病害类别数</span>
            <strong class="theme-metric-card__value">{{ statList.length }}</strong>
          </div>
          <div class="theme-metric-card">
            <span class="theme-metric-card__label">检测明细数</span>
            <strong class="theme-metric-card__value">{{ detectionCount }}</strong>
          </div>
          <div class="theme-metric-card">
            <span class="theme-metric-card__label">结果文件数</span>
            <strong class="theme-metric-card__value">{{ fileCount }}</strong>
          </div>
        </div>

        <div v-if="errorMessage">
          <ErrorState
            title="结果加载失败"
            :description="errorMessage"
            @retry="fetchResult"
            @back="goTaskDetail"
          />
        </div>

        <template v-else>
          <section class="theme-grid-two">
            <div class="theme-panel">
              <div class="theme-panel__head">结果文件</div>
              <p class="theme-panel__sub">任务完成后在这里统一打开最终产物。</p>

              <div
                v-if="result?.annotated_video_url || result?.json_url || result?.report_url"
                class="theme-hero__actions"
              >
                <el-button
                  v-if="result?.annotated_video_url"
                  type="primary"
                  @click="openExternal(result.annotated_video_url)"
                >
                  查看标注视频
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
              </div>

              <EmptyState
                v-else
                title="暂无结果文件"
                description="当前结果尚未返回标注视频、JSON 或 HTML 报告地址。"
              />
            </div>

            <div class="theme-panel">
              <div class="theme-panel__head">病害统计</div>
              <p class="theme-panel__sub">根据结果摘要汇总病害类别分布。</p>

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
                title="暂无统计信息"
                description="结果中未返回病害统计摘要。"
              />
            </div>
          </section>

          <section class="theme-panel" style="margin-bottom: 24px;">
            <div class="theme-panel__head">结果摘要</div>
            <p class="theme-panel__sub">保留原始 summary 结构化内容，方便排查与核对。</p>

            <pre v-if="summaryText" class="theme-code">{{ summaryText }}</pre>
            <div v-else-if="loading" class="theme-empty-note">结果加载中...</div>
            <EmptyState
              v-else
              title="暂无摘要"
              description="当前结果未包含 summary 字段。"
            />
          </section>

          <section class="theme-panel soft-table">
            <div class="theme-panel__head">检测明细</div>
            <p class="theme-panel__sub">展示结果接口返回的 detections 列表。</p>

            <template v-if="detectionRows.length > 0">
              <el-table :data="detectionRows" stripe style="width: 100%">
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
              title="暂无检测明细"
              description="结果接口未返回 detections 明细列表。"
            />
          </section>
        </template>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getResult, getTask } from '@/api'

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const task = ref({})
const result = ref({})

const statusText = computed(() => {
  const status = String(task.value?.status || result.value?.status || 'unknown').toLowerCase()
  if (status === 'completed') return 'completed'
  if (status === 'processing') return 'processing'
  if (status === 'failed') return 'failed'
  return status
})

const statusTagType = computed(() => {
  if (statusText.value === 'completed') return 'success'
  if (statusText.value === 'processing') return 'warning'
  if (statusText.value === 'failed') return 'danger'
  return 'info'
})

const totalDetections = computed(() => {
  if (Array.isArray(result.value?.detections)) return result.value.detections.length
  return Number(result.value?.summary?.total_detections || 0)
})

const damageStats = computed(() => {
  const stats =
    result.value?.summary?.damage_types ||
    result.value?.summary?.class_stats ||
    result.value?.summary?.category_stats ||
    {}

  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return []

  return Object.entries(stats).map(([name, count]) => ({
    name,
    count
  }))
})

const damageTypeCount = computed(() => damageStats.value.length || 0)

const fileCount = computed(() => {
  let count = 0
  if (result.value?.output_video_url) count += 1
  if (result.value?.result_json_url) count += 1
  if (result.value?.report_url) count += 1
  return count
})

const summaryEntries = computed(() => {
  const summary = result.value?.summary
  if (!summary || typeof summary !== 'object') return []

  return Object.entries(summary).map(([key, value]) => ({
    key,
    value: formatValue(value)
  }))
})

const detectionRows = computed(() => {
  return Array.isArray(result.value?.detections) ? result.value.detections : []
})

const prettyRawResult = computed(() => {
  return JSON.stringify(result.value?.raw_result || {}, null, 2)
})

const prettySummary = computed(() => {
  return JSON.stringify(result.value?.summary || {}, null, 2)
})

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatConfidence(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toFixed(2)
}

function formatBbox(value) {
  if (!Array.isArray(value)) return '-'
  return `[${value.join(', ')}]`
}

function openUrl(url) {
  if (!url) return
  window.open(url, '_blank')
}

function goHome() {
  router.push('/')
}

function goTaskDetail() {
  router.push(`/task/${props.taskId}`)
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [taskRes, resultRes] = await Promise.allSettled([
      getTask(props.taskId),
      getResult(props.taskId)
    ])

    if (taskRes.status === 'fulfilled') {
      task.value = taskRes.value.data || {}
    }

    if (resultRes.status === 'fulfilled') {
      result.value = resultRes.value.data || {}
    } else {
      const maybeMessage =
        resultRes.reason?.response?.data?.detail ||
        resultRes.reason?.message ||
        '结果尚未生成'
      errorMessage.value = maybeMessage
    }
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      '加载结果失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.taskId,
  () => {
    loadData()
  }
)

onMounted(() => {
  loadData()
})
</script>