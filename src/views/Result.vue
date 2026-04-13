<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <div>
          <h1>任务结果</h1>
          <p class="muted">任务 ID：{{ taskId }}</p>
        </div>

        <div class="actions">
          <el-button type="primary" @click="refreshResult">刷新结果</el-button>
          <el-button @click="goTaskDetail">返回任务页</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />

      <div class="meta">
        <el-tag>{{ status }}</el-tag>
        <el-tag>{{ `病害类别：${statList.length}` }}</el-tag>
        <el-tag>{{ `检测明细：${detectionCount}` }}</el-tag>
        <el-tag>{{ `结果文件：${fileCount}` }}</el-tag>
      </div>

      <div class="section">
        <h3>结果文件</h3>
        <div class="actions">
          <el-button
            v-if="result.output_video_url || result.annotated_video_url"
            type="primary"
            @click="openExternal(result.output_video_url || result.annotated_video_url)"
          >
            查看标注视频
          </el-button>

          <el-button
            v-if="result.result_json_url || result.json_url"
            @click="openExternal(result.result_json_url || result.json_url)"
          >
            查看 JSON
          </el-button>

          <el-button
            v-if="result.report_url"
            @click="openExternal(result.report_url)"
          >
            查看 HTML 报告
          </el-button>
        </div>
      </div>

      <div class="section">
        <h3>病害统计</h3>
        <div v-if="statList.length" class="stats">
          <div v-for="item in statList" :key="item.name" class="stat-item">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
        <p v-else class="muted">暂无统计信息</p>
      </div>

      <div class="section">
        <h3>结果摘要</h3>
        <pre class="code">{{ summaryText }}</pre>
      </div>

      <div class="section">
        <h3>检测明细</h3>
        <el-table v-if="detectionRows.length" :data="detectionRows" stripe style="width: 100%">
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
        <p v-else class="muted">暂无检测明细</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getResult, getTask } from '@/api'

const props = defineProps({
  taskId: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()

const taskId = computed(() => props.taskId || route.params.taskId)

const loading = ref(false)
const errorMessage = ref('')
const task = ref({})
const result = ref({})

const status = computed(() => {
  return String(task.value?.status || result.value?.status || 'unknown').toLowerCase()
})

const statList = computed(() => {
  const stats =
    result.value?.summary?.damage_types ||
    result.value?.summary?.class_stats ||
    result.value?.summary?.category_stats ||
    {}

  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    return []
  }

  return Object.entries(stats).map(([name, count]) => ({
    name,
    count
  }))
})

const detectionRows = computed(() => {
  return Array.isArray(result.value?.detections) ? result.value.detections : []
})

const detectionCount = computed(() => detectionRows.value.length)

const fileCount = computed(() => {
  let count = 0
  if (result.value?.output_video_url || result.value?.annotated_video_url) count += 1
  if (result.value?.result_json_url || result.value?.json_url) count += 1
  if (result.value?.report_url) count += 1
  return count
})

const summaryText = computed(() => {
  return JSON.stringify(result.value?.summary || {}, null, 2)
})

function formatConfidence(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toFixed(2)
}

function formatBbox(value) {
  if (!Array.isArray(value)) return '-'
  return `[${value.join(', ')}]`
}

function openExternal(url) {
  if (!url) return
  window.open(url, '_blank')
}

function goHome() {
  router.push('/')
}

function goTaskDetail() {
  router.push(`/task/${taskId.value}`)
}

async function fetchResult() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [taskRes, resultRes] = await Promise.allSettled([
      getTask(taskId.value),
      getResult(taskId.value)
    ])

    if (taskRes.status === 'fulfilled') {
      task.value = taskRes.value.data || {}
    }

    if (resultRes.status === 'fulfilled') {
      result.value = resultRes.value.data || {}
    } else {
      errorMessage.value =
        resultRes.reason?.response?.data?.detail ||
        resultRes.reason?.message ||
        '结果尚未生成'
    }
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      '加载结果失败'
  } finally {
    loading.value = false
  }
}

function refreshResult() {
  fetchResult()
}

watch(
  () => taskId.value,
  () => {
    fetchResult()
  }
)

onMounted(() => {
  fetchResult()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f8fb;
}
.card {
  max-width: 1100px;
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
  margin-bottom: 24px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
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