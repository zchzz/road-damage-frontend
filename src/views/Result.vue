<template>
  <div class="result-page">
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-badge">分析结果</div>
        <h1>视频分析结果</h1>
        <p>
          展示任务状态、结果视频、JSON 文件、HTML 报告、统计摘要与检测明细。
        </p>

        <div class="hero-meta">
          <div class="meta-item">
            <span class="label">任务 ID</span>
            <span class="value">{{ taskId }}</span>
          </div>
          <div class="meta-item">
            <span class="label">状态</span>
            <el-tag :type="statusTagType" round>{{ statusText }}</el-tag>
          </div>
        </div>

        <div class="hero-actions">
          <el-button type="primary" @click="loadData" :loading="loading">刷新结果</el-button>
          <el-button @click="goTaskDetail">任务详情</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </div>
      </div>

      <div class="hero-right">
        <div class="stat-card">
          <div class="stat-label">总检测数</div>
          <div class="stat-value">{{ totalDetections }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">病害类别数</div>
          <div class="stat-value">{{ damageTypeCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">结果文件数</div>
          <div class="stat-value">{{ fileCount }}</div>
        </div>
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      class="section-gap"
      :closable="false"
    />

    <el-row :gutter="20" class="section-gap">
      <el-col :xs="24" :lg="24">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>结果文件</span>
              <span class="panel-subtitle">直接打开结果资源</span>
            </div>
          </template>

          <div class="file-actions">
            <el-button
              v-if="result.output_video_url"
              type="primary"
              @click="openUrl(result.output_video_url)"
            >
              查看结果视频
            </el-button>

            <el-button
              v-if="result.result_json_url"
              @click="openUrl(result.result_json_url)"
            >
              查看 JSON 文件
            </el-button>

            <el-button
              v-if="result.report_url"
              @click="openUrl(result.report_url)"
            >
              查看 HTML 报告
            </el-button>

            <el-empty
              v-if="!result.output_video_url && !result.result_json_url && !result.report_url"
              description="暂无可访问的结果文件"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section-gap">
      <el-col :xs="24" :lg="24">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>标注视频</span>
              <span class="panel-subtitle">后端返回的结果视频</span>
            </div>
          </template>

          <div class="video-wrapper" v-loading="loading">
            <video
              v-if="result.output_video_url"
              :src="result.output_video_url"
              controls
              preload="metadata"
              class="result-video"
            />
            <el-empty v-else description="暂无结果视频" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section-gap">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>结果摘要</span>
              <span class="panel-subtitle">summary 字段可视化</span>
            </div>
          </template>

          <div v-if="summaryEntries.length" class="summary-grid">
            <div
              v-for="item in summaryEntries"
              :key="item.key"
              class="summary-item"
            >
              <div class="summary-key">{{ item.key }}</div>
              <div class="summary-value">{{ item.value }}</div>
            </div>
          </div>

          <el-empty v-else description="暂无摘要数据" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>病害统计</span>
              <span class="panel-subtitle">按类别聚合</span>
            </div>
          </template>

          <div v-if="damageStats.length" class="damage-stats">
            <div
              v-for="item in damageStats"
              :key="item.name"
              class="damage-stat-item"
            >
              <span class="damage-name">{{ item.name }}</span>
              <span class="damage-count">{{ item.count }}</span>
            </div>
          </div>

          <el-empty v-else description="暂无病害类别统计" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section-gap">
      <el-col :span="24">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>检测明细</span>
              <span class="panel-subtitle">detections 结构化数据</span>
            </div>
          </template>

          <el-table
            v-if="detectionRows.length"
            :data="detectionRows"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column label="病害类型" min-width="160">
              <template #default="{ row }">
                {{ row.class_name || row.name || row.label || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="置信度" min-width="120">
              <template #default="{ row }">
                {{ formatConfidence(row.confidence) }}
              </template>
            </el-table-column>
            <el-table-column label="边界框" min-width="260">
              <template #default="{ row }">
                {{ formatBbox(row.bbox || row.box) }}
              </template>
            </el-table-column>
            <el-table-column label="帧号" min-width="100">
              <template #default="{ row }">
                {{ row.frame ?? row.frame_id ?? '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="暂无检测明细" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section-gap">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>原始结果 JSON</span>
              <span class="panel-subtitle">便于调试和复制</span>
            </div>
          </template>
          <pre class="json-block">{{ prettyRawResult }}</pre>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>摘要 JSON</span>
              <span class="panel-subtitle">summary 格式化输出</span>
            </div>
          </template>
          <pre class="json-block">{{ prettySummary }}</pre>
        </el-card>
      </el-col>
    </el-row>
  </div>
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

<style scoped>
.result-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 25%),
    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
}

.section-gap {
  margin-top: 22px;
}

.hero-card {
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.hero-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.hero-left h1 {
  margin: 16px 0 8px;
  font-size: 38px;
  line-height: 1.15;
  color: #0f172a;
}

.hero-left p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 22px;
}

.meta-item {
  min-width: 200px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.meta-item .label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.meta-item .value {
  display: block;
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
  word-break: break-all;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero-right {
  display: grid;
  gap: 16px;
}

.stat-card {
  padding: 22px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.stat-label {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.panel-card {
  border-radius: 20px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-weight: 700;
}

.panel-subtitle {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.video-wrapper {
  min-height: 340px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-video {
  width: 100%;
  max-height: 680px;
  background: #000;
  display: block;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.summary-key {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 8px;
}

.summary-value {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
  word-break: break-word;
}

.damage-stats {
  display: grid;
  gap: 12px;
}

.damage-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.damage-name {
  color: #334155;
  font-weight: 600;
}

.damage-count {
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 999px;
  text-align: center;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  font-weight: 800;
}

.json-block {
  margin: 0;
  padding: 18px;
  min-height: 280px;
  border-radius: 16px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.75;
}

@media (max-width: 1024px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .result-page {
    padding: 16px;
  }

  .hero-card {
    padding: 20px;
  }

  .hero-left h1 {
    font-size: 30px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .file-actions {
    flex-direction: column;
  }

  .hero-actions .el-button,
  .file-actions .el-button {
    width: 100%;
  }
}
</style>