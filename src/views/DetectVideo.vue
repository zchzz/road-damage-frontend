<template>
  <div class="detect-page">
    <div class="page-header">
      <h2>视频分析</h2>
      <p>上传道路巡检视频，系统将自动创建分析任务。</p>
    </div>

    <div class="panel">
      <div class="form-item">
        <label>选择视频文件</label>
        <input
          type="file"
          accept=".mp4,.avi,.mov,.mkv"
          @change="handleFileChange"
        />
        <div v-if="selectedFile" class="tip">
          已选择：{{ selectedFile.name }}
        </div>
      </div>

      <div class="form-item">
        <label>置信度阈值</label>
        <input
          v-model.number="confidence"
          type="number"
          min="0"
          max="1"
          step="0.01"
        />
      </div>

      <div class="form-item">
        <label>跳帧间隔</label>
        <input
          v-model.number="skipFrames"
          type="number"
          min="1"
          step="1"
        />
      </div>

      <div v-if="errorMsg" class="error">
        {{ errorMsg }}
      </div>

      <button class="submit-btn" :disabled="loading" @click="handleSubmit">
        {{ loading ? '任务创建中...' : '开始分析' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { uploadVideo } from '@/api'

const router = useRouter()

const selectedFile = ref(null)
const confidence = ref(0.25)
const skipFrames = ref(1)
const loading = ref(false)
const errorMsg = ref('')

function handleFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null
}

async function handleSubmit() {
  if (!selectedFile.value) {
    errorMsg.value = '请先选择视频文件'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('confidence', String(confidence.value))
    formData.append('skip_frames', String(skipFrames.value))

    // 若后端还暂时保留 mode，可兼容传一个固定值
    // formData.append('mode', 'video')

    const { data } = await uploadVideo(formData)
    router.push(`/task/${data.task_id}`)
  } catch (error) {
    errorMsg.value =
      error?.response?.data?.detail || '任务创建失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.detect-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 20px;
}
.page-header {
  margin-bottom: 24px;
}
.panel {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 24px;
}
.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}
.tip {
  margin-top: 8px;
  color: #666;
}
.error {
  margin-bottom: 16px;
  color: #d93025;
}
.submit-btn {
  padding: 12px 24px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>