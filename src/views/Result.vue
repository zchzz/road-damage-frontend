<template>
  <MainLayout>
    <PageContainer>
      <div class="result-page">
        <section class="page-hero">
          <div class="page-hero__main">
            <div class="page-hero__badge">Detection Result Report</div>
            <h1 class="page-hero__title">检测结果</h1>
            <p class="page-hero__desc">
              集中展示任务输出结果，包括标注视频、统计摘要、结果文件与检测信息。
            </p>

            <div class="page-hero__meta">
              <div class="meta-item">
                <span class="meta-item__label">任务 ID</span>
                <span class="meta-item__value">{{ taskId }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-item__label">结果状态</span>
                <StatusTag :status="status" />
              </div>
            </div>
          </div>

          <div class="page-hero__side">
            <SectionCard title="页面操作" description="你可以继续查看任务过程或返回首页。">
              <div class="action-list">
                <el-button @click="goHome">返回首页</el-button>
                <el-button @click="goTaskDetail">返回任务页</el-button>
                <el-button
                  type="primary"
                  :disabled="loading"
                  @click="refreshResult"
                >
                  刷新结果
                </el-button>
              </div>
            </SectionCard>
          </div>
        </section>

        <div v-if="loading" class="section-gap">
          <SectionCard title="结果加载中" description="正在获取检测结果与输出文件。">
            <el-skeleton :rows="6" animated />
          </SectionCard>
        </div>

        <div v-else-if="errorMessage" class="section-gap">
          <ErrorState
            title="结果加载失败"
            :description="errorMessage"
            @retry="fetchResult"
            @back="goTaskDetail"
          />
        </div>

        <template v-else>
          <div class="dashboard-grid section-gap">
            <SectionCard
              title="结果总览"
              description="展示当前任务结果摘要与输出状态。"
            >
              <div class="overview-grid">
                <div class="overview-card">
                  <div class="overview-card__label">任务状态</div>
                  <div class="overview-card__value">
                    {{ result?.status || 'completed' }}
                  </div>
                </div>

                <div class="overview-card">
                  <div class="overview-card__label">病害类别数</div>
                  <div class="overview-card__value">
                    {{ statList.length }}
                  </div>
                </div>

                <div class="overview-card">
                  <div class="overview-card__label">检测明细数</div>
                  <div class="overview-card__value">
                    {{ detectionCount }}
                  </div>
                </div>

                <div class="overview-card">
                  <div class="overview-card__label">结果文件数</div>
                  <div class="overview-card__value">
                    {{ fileCount }}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="结果文件"
              description="输出文件可直接预览或打开。"
            >
              <div class="result-actions">
                <el-button
                  v-if="result?.annotated_video_url"
                  type="primary"
                  @click="openExternal(result.annotated_video_url)"
                >
                  查看标注视频
                </el-button>

                <el-button
                  v-if="result?.json_url"
                  @click="openExternal(result.json_url)"
                >
                  查看 JSON
                </el-button>

                <el-button
                  v-if="result?.report_url"
                  @click="openExternal(result.report_url)"
                >
                  查看 HTML 报告
                </el-button>
              </div>
            </SectionCard>
          </div>

          <div class="section-gap">
            <SectionCard
              title="标注结果视频"
              description="用于查看模型输出后的检测标注视频。"
            >
              <div class="video-wrapper">
                <template v-if="result?.annotated_video_url">
                  <video
                    :src="result.annotated_video_url"
                    controls
                    preload="metadata"
                    class="result-video"
                  />
                </template>

                <template v-else>
                  <EmptyState
                    title="暂无结果视频"
                    description="当前结果中未返回可播放的标注视频地址。"
                  />
                </template>
              </div>
            </SectionCard>
          </div>

          <div class="content-grid section-gap">
            <SectionCard
              title="病害统计"
              description="根据结果摘要汇总病害类别分布。"
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
                title="暂无统计信息"
                description="结果中未返回病害统计摘要。"
              />
            </SectionCard>

            <SectionCard
              title="结果摘要"
              description="原始摘要信息以结构化文本形式展示。"
            >
              <template v-if="summaryText">
                <pre class="summary-block">{{ summaryText }}</pre>
              </template>

              <EmptyState
                v-else
                title="暂无摘要"
                description="当前结果未包含 summary 字段。"
              />
            </SectionCard>
          </div>

          <div class="section-gap">
            <SectionCard
              title="检测明细"
              description="展示结果中返回的检测明细信息。"
            >
              <template v-if="detectionRows.length > 0">
                <el-table :data="detectionRows" border stripe style="width: 100%">
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
                title="暂无检测明细"
                description="结果接口未返回 detections 明细列表。"
              />
            </SectionCard>
          </div>
        </template>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import MainLayout from '@/layouts/MainLayout.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { getTaskResult } from '@/api/result'
import { useTaskStore } from '@/stores/task'

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const taskStore = useTaskStore()

const loading = ref(false)
const errorMessage = ref('')

const taskId = computed(() => props.taskId)
const result = computed(() => taskStore.result)
const status = computed(() => taskStore.status || result.value?.status || 'completed')

const statList = computed(() => taskStore.statList)

const detectionRows = computed(() => {
  if (Array.isArray(result.value?.detections)) {
    return result.value.detections
  }
  if (Array.isArray(taskStore.detections)) {
    return taskStore.detections
  }
  return []
})

const detectionCount = computed(() => detectionRows.value.length)

const fileCount = computed(() => {
  let count = 0
  if (result.value?.annotated_video_url) count += 1
  if (result.value?.json_url) count += 1
  if (result.value?.report_url) count += 1
  return count
})

const summaryText = computed(() => {
  const summary = result.value?.summary || taskStore.summary || {}
  if (!summary || Object.keys(summary).length === 0) return ''
  return JSON.stringify(summary, null, 2)
})

function goHome() {
  router.push('/')
}

function goTaskDetail() {
  router.push(`/task/${taskId.value}`)
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

async function fetchResult(force = false) {
  if (!force && taskStore.result && taskStore.currentTaskId === taskId.value) {
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    if (taskStore.currentTaskId !== taskId.value) {
      taskStore.resetTask()
      taskStore.setTask({
        taskId: taskId.value,
        status: 'completed'
      })
    }

    const res = await getTaskResult(taskId.value)
    taskStore.setResult(res)
    taskStore.clearError()
  } catch (error) {
    errorMessage.value = error?.message || '获取结果失败'
    taskStore.setError(errorMessage.value)
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function refreshResult() {
  fetchResult(true)
}

watch(
  () => taskId.value,
  () => {
    fetchResult(true)
  }
)

onMounted(() => {
  fetchResult(false)
})
</script>

<style scoped>
.result-page {
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
  background: linear-gradient(135deg, #14532d 0%, #166534 100%);
  box-shadow: 0 20px 50px rgba(22, 101, 52, 0.14);
  color: #fff;
}

.page-hero__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #dcfce7;
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
  color: rgba(255, 255, 255, 0.82);
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
  grid-template-columns: 1.2fr 0.9fr;
  gap: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  padding: 18px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
}

.overview-card__label {
  font-size: 13px;
  color: #64748b;
}

.overview-card__value {
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

.video-wrapper {
  min-height: 320px;
  border-radius: 18px;
  overflow: hidden;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-video {
  width: 100%;
  display: block;
  background: #000;
  max-height: 640px;
  outline: none;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
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

.summary-block {
  margin: 0;
  padding: 16px;
  border-radius: 14px;
  background: #0f172a;
  color: #e5e7eb;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
}

@media (max-width: 1100px) {
  .page-hero,
  .dashboard-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .result-page {
    padding-top: 20px;
  }

  .page-hero__main {
    padding: 20px;
  }

  .page-hero__title {
    font-size: 28px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .action-list .el-button,
  .result-actions .el-button {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>