<template>
  <div class="detect-page">
    <section class="hero-card">
      <div>
        <p class="hero-tag">Road Damage Detection</p>
        <h1>道路巡检视频分析</h1>
        <p class="hero-desc">
          上传巡检视频后，系统会自动创建分析任务。你可以先选择检测精度，再根据场景微调置信度和跳帧间隔。
        </p>
      </div>

      <div class="hero-badges">
        <span>支持 MP4 / AVI / MOV / MKV</span>
        <span>最大 {{ MAX_VIDEO_SIZE_MB }}MB</span>
        <span>异步任务处理</span>
      </div>
    </section>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <h2>上传文件</h2>
          <p>先选择视频，再设置检测参数。</p>
        </div>

        <input
          ref="fileInputRef"
          class="hidden-input"
          type="file"
          accept=".mp4,.avi,.mov,.mkv"
          @change="handleFileChange"
        />

        <div class="upload-box" @click="openFilePicker">
          <div class="upload-icon">🎥</div>
          <div class="upload-text">
            <h3>{{ selectedFile ? '重新选择视频' : '点击上传巡检视频' }}</h3>
            <p>支持常见视频格式，建议上传稳定拍摄的道路巡检视频</p>
          </div>
        </div>

        <div v-if="selectedFile" class="file-card">
          <div class="file-main">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-meta">
              <span>{{ selectedFileSize }}</span>
              <span>{{ selectedFile.type || 'video/*' }}</span>
            </div>
          </div>
          <button class="text-btn" type="button" @click="clearFile">移除</button>
        </div>

        <div class="tips">
          <span>仅允许视频文件</span>
          <span>大小限制：{{ MAX_VIDEO_SIZE_MB }}MB</span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>检测参数</h2>
          <p>精度模式会自动带出推荐跳帧，你仍然可以手动调整。</p>
        </div>

        <div class="form-item">
          <label>检测精度</label>
          <div class="precision-grid">
            <button
              v-for="item in precisionOptions"
              :key="item.value"
              type="button"
              class="precision-card"
              :class="{ active: precision === item.value }"
              @click="applyPrecisionPreset(item.value)"
            >
              <div class="precision-top">
                <strong>{{ item.label }}</strong>
                <span>跳帧 {{ item.skipFrames }}</span>
              </div>
              <p>{{ item.desc }}</p>
            </button>
          </div>
        </div>

        <div class="form-item">
          <label>置信度阈值</label>
          <div class="range-row">
            <input
              v-model.number="confidence"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="range-input"
            />
            <span class="value-pill">{{ confidence.toFixed(2) }}</span>
          </div>
          <p class="form-help">
            值越高越严格，误检更少；值越低越容易检出更多疑似目标。
          </p>
        </div>

        <div class="form-item">
          <label>跳帧间隔</label>
          <div class="number-row">
            <input
              v-model.number="skipFrames"
              type="number"
              min="1"
              step="1"
              class="number-input"
            />
            <span class="inline-tip">{{ currentPrecisionText }}</span>
          </div>
          <p class="form-help">
            数值越小，分析越细致但处理更慢；数值越大，速度更快但可能漏掉短暂病害。
          </p>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <span>精度模式</span>
            <strong>{{ currentPrecisionLabel }}</strong>
          </div>
          <div class="summary-item">
            <span>置信度</span>
            <strong>{{ confidence.toFixed(2) }}</strong>
          </div>
          <div class="summary-item">
            <span>跳帧</span>
            <strong>{{ skipFrames }}</strong>
          </div>
        </div>

        <div v-if="loading" class="progress-wrap">
          <div class="progress-top">
            <span>上传中</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>

        <div v-if="errorMsg" class="error-box">
          {{ errorMsg }}
        </div>

        <button
          class="submit-btn"
          :disabled="loading || !selectedFile"
          @click="handleSubmit"
        >
          {{ loading ? '任务创建中...' : '开始分析' }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { uploadVideo } from '@/api'

const router = useRouter()

const MAX_VIDEO_SIZE_MB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB || 500)
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.mkv'])

const precisionOptions = [
  {
    value: 'high',
    label: '高精度',
    skipFrames: 1,
    desc: '保留更多帧，适合短视频或更关注识别效果的场景。'
  },
  {
    value: 'balanced',
    label: '均衡',
    skipFrames: 3,
    desc: '兼顾检测效果与处理速度，适合作为默认模式。'
  },
  {
    value: 'fast',
    label: '快速',
    skipFrames: 5,
    desc: '减少处理帧数，适合超长视频或追求更快出结果。'
  }
]

const fileInputRef = ref(null)
const selectedFile = ref(null)
const precision = ref('balanced')
const confidence = ref(0.25)
const skipFrames = ref(3)
const loading = ref(false)
const errorMsg = ref('')
const uploadProgress = ref(0)

const currentPrecision = computed(
  () => precisionOptions.find((item) => item.value === precision.value) || precisionOptions[1]
)

const currentPrecisionLabel = computed(() => currentPrecision.value.label)

const currentPrecisionText = computed(
  () => `当前推荐跳帧：${currentPrecision.value.skipFrames}`
)

const selectedFileSize = computed(() => {
  if (!selectedFile.value) return '--'
  return formatFileSize(selectedFile.value.size)
})

function openFilePicker() {
  fileInputRef.value?.click()
}

function clearNativeInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function clearFile() {
  selectedFile.value = null
  errorMsg.value = ''
  uploadProgress.value = 0
  clearNativeInput()
}

function applyPrecisionPreset(value) {
  const matched = precisionOptions.find((item) => item.value === value)
  if (!matched) return

  precision.value = matched.value
  skipFrames.value = matched.skipFrames
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function handleFileChange(event) {
  errorMsg.value = ''
  uploadProgress.value = 0

  const file = event.target.files?.[0] || null
  if (!file) {
    selectedFile.value = null
    return
  }

  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    selectedFile.value = null
    errorMsg.value = '仅支持上传 MP4、AVI、MOV、MKV 格式的视频文件'
    clearNativeInput()
    return
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    selectedFile.value = null
    errorMsg.value = `视频文件过大，当前限制为 ${MAX_VIDEO_SIZE_MB}MB`
    clearNativeInput()
    return
  }

  selectedFile.value = file
}

async function handleSubmit() {
  if (!selectedFile.value) {
    errorMsg.value = '请先选择视频文件'
    return
  }

  if (confidence.value < 0 || confidence.value > 1) {
    errorMsg.value = '置信度阈值必须在 0 到 1 之间'
    return
  }

  skipFrames.value = Math.max(1, Number(skipFrames.value) || 1)

  loading.value = true
  errorMsg.value = ''
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('mode', 'video')
    formData.append('precision', precision.value)
    formData.append('confidence', String(confidence.value))
    formData.append('skip_frames', String(skipFrames.value))

    const { data } = await uploadVideo(formData, {
      timeout: 10 * 60 * 1000,
      onUploadProgress: (event) => {
        if (!event.total) return
        uploadProgress.value = Math.min(
          100,
          Math.round((event.loaded / event.total) * 100)
        )
      }
    })

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
  min-height: 100vh;
  padding: 32px 20px 48px;
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #f6f9ff 0%, #f7f9fc 100%);
}

.hero-card {
  max-width: 1180px;
  margin: 0 auto 24px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f62fe 0%, #4f8cff 100%);
  color: #fff;
  box-shadow: 0 20px 45px rgba(15, 98, 254, 0.18);
}

.hero-tag {
  display: inline-flex;
  margin: 0 0 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card h1 {
  margin: 0 0 10px;
  font-size: 34px;
  line-height: 1.2;
}

.hero-desc {
  max-width: 760px;
  margin: 0;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-badges span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 13px;
}

.content-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 24px;
}

.panel {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 24px;
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #0f172a;
}

.panel-header p {
  margin: 0;
  color: #64748b;
}

.hidden-input {
  display: none;
}

.upload-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 26px 20px;
  border: 2px dashed #b8ccff;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  cursor: pointer;
  transition: 0.2s ease;
}

.upload-box:hover {
  transform: translateY(-2px);
  border-color: #6ea0ff;
  box-shadow: 0 12px 28px rgba(22, 119, 255, 0.08);
}

.upload-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  font-size: 26px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.upload-text h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #0f172a;
}

.upload-text p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.file-card {
  margin-top: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e8eef7;
}

.file-name {
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.file-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.text-btn {
  border: none;
  background: transparent;
  color: #1677ff;
  font-weight: 600;
  cursor: pointer;
}

.tips {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.form-item + .form-item {
  margin-top: 22px;
}

.form-item label {
  display: block;
  margin-bottom: 10px;
  font-weight: 700;
  color: #0f172a;
}

.precision-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.precision-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #e8eef7;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.precision-card:hover {
  transform: translateY(-2px);
  border-color: #9bbcff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.precision-card.active {
  border-color: #1677ff;
  background: linear-gradient(180deg, #f3f8ff 0%, #ecf4ff 100%);
  box-shadow: 0 12px 28px rgba(22, 119, 255, 0.12);
}

.precision-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  color: #0f172a;
}

.precision-top span {
  color: #1677ff;
  font-size: 13px;
  font-weight: 700;
}

.precision-card p {
  margin: 0;
  line-height: 1.6;
  color: #64748b;
  font-size: 14px;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.range-input {
  flex: 1;
}

.value-pill {
  min-width: 62px;
  text-align: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1677ff;
  font-weight: 700;
}

.number-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.number-input {
  width: 140px;
  padding: 12px 14px;
  border: 1px solid #d9e2ef;
  border-radius: 14px;
  outline: none;
  font-size: 15px;
}

.number-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
}

.inline-tip,
.form-help {
  color: #64748b;
  font-size: 14px;
}

.form-help {
  margin: 8px 0 0;
  line-height: 1.6;
}

.summary-card {
  margin-top: 22px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
  border: 1px solid #e1edff;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-item + .summary-item {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #d8e6ff;
}

.summary-item span {
  color: #64748b;
}

.summary-item strong {
  color: #0f172a;
}

.progress-wrap {
  margin-top: 18px;
}

.progress-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #334155;
  font-size: 14px;
}

.progress-bar {
  height: 10px;
  border-radius: 999px;
  background: #e8eef7;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1677ff 0%, #55a3ff 100%);
  transition: width 0.2s ease;
}

.error-box {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  line-height: 1.6;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  padding: 14px 18px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #1677ff 0%, #5a9cff 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(22, 119, 255, 0.22);
  transition: 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 960px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .precision-grid {
    grid-template-columns: 1fr;
  }

  .hero-card h1 {
    font-size: 28px;
  }
}
</style>