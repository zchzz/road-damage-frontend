<template>
  <div class="result-page">
    <div class="header">
      <h2>视频分析结果</h2>
      <p>任务 ID：{{ taskId }}</p>
    </div>

    <div v-if="loading" class="panel">
      正在加载结果...
    </div>

    <div v-else-if="errorMsg" class="panel error">
      {{ errorMsg }}
    </div>

    <div v-else-if="result" class="content">
      <div class="panel">
        <h3>结果摘要</h3>
        <div class="summary-grid">
          <div class="item">
            <div class="name">状态</div>
            <div class="value">{{ result.status }}</div>
          </div>
          <div class="item">
            <div class="name">总检测数</div>
            <div class="value">{{ result.summary?.total_detections ?? '-' }}</div>
          </div>
          <div class="item">
            <div class="name">病害类别数</div>
            <div class="value">{{ result.summary?.category_count ?? '-' }}</div>
          </div>
        </div>
      </div>

      <div class="panel" v-if="result.output_video_url">
        <h3>标注视频</h3>
        <video :src="result.output_video_url" controls style="width: 100%; max-width: 900px;"></video>
      </div>

      <div class="panel" v-if="result.detections?.length">
        <h3>检测明细</h3>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>类别</th>
              <th>置信度</th>
              <th>帧号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in result.detections" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.class_name || item.label || '-' }}</td>
              <td>{{ item.confidence ?? '-' }}</td>
              <td>{{ item.frame_index ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel" v-if="result.report_url">
        <h3>结果文件</h3>
        <a :href="result.report_url" target="_blank">下载结果文件</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getResult } from '@/api'

const route = useRoute()
const taskId = route.params.taskId

const result = ref(null)
const loading = ref(false)
const errorMsg = ref('')

async function fetchResult() {
  loading.value = true
  errorMsg.value = ''

  try {
    const { data } = await getResult(taskId)
    result.value = data
  } catch (error) {
    errorMsg.value =
      error?.response?.data?.detail || '获取结果失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchResult)
</script>

<style scoped>
.result-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}
.header {
  margin-bottom: 24px;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.panel {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 24px;
}
.error {
  color: #d93025;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.item {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px;
}
.name {
  color: #666;
  margin-bottom: 8px;
}
.value {
  font-size: 20px;
  font-weight: 700;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  border: 1px solid #eee;
  padding: 10px 12px;
}
</style>