<template>
  <div class="page">
    <div class="container">
      <h2>检测结果</h2>

      <el-skeleton :loading="loading" animated>
        <template #default>
          <ResultVideo :src="result?.annotated_video_url" />

          <div class="grid">
            <ResultChart :summary="chartData" />
            <el-card shadow="hover">
              <template #header>
                <div class="title">结果文件</div>
              </template>

              <div class="links">
                <el-link
                  v-if="result?.annotated_video_url"
                  :href="result.annotated_video_url"
                  target="_blank"
                >
                  查看结果视频
                </el-link>

                <el-link
                  v-if="result?.json_url"
                  :href="result.json_url"
                  target="_blank"
                >
                  下载结果 JSON
                </el-link>

                <el-link
                  v-if="result?.report_url"
                  :href="result.report_url"
                  target="_blank"
                >
                  查看 HTML 报告
                </el-link>
              </div>
            </el-card>
          </div>

          <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
              <div class="title">结果摘要</div>
            </template>
            <pre>{{ JSON.stringify(result?.summary || {}, null, 2) }}</pre>
          </el-card>

          <div class="actions">
            <el-button @click="goHome">返回首页</el-button>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskResult } from '../api/result'
import ResultVideo from '../components/ResultVideo.vue'
import ResultChart from '../components/ResultChart.vue'

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const loading = ref(true)
const result = ref(null)

const chartData = computed(() => {
  return result.value?.summary?.damage_types || result.value?.summary || {}
})

function goHome() {
  router.push('/')
}

async function fetchResult() {
  try {
    loading.value = true
    const res = await getTaskResult(props.taskId)
    result.value = res
  } catch (error) {
    ElMessage.error(error.message || '获取结果失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchResult()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.actions {
  margin-top: 20px;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>