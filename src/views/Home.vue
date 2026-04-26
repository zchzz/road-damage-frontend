<template>
  <div class="home-page">
    <div class="page-shell">
      <section class="hero-section">
        <div class="hero-left">
          <div class="hero-badge">本科毕业设计系统首页</div>
          <h1 class="hero-title">基于深度学习的道路病害视频分析平台</h1>
          <p class="hero-desc">
            本系统面向道路病害检测场景，支持检测视频上传、参数配置、抽帧处理、
            检测任务提交以及任务详情查看，适用于本科毕业设计系统展示与答辩演示。
          </p>

          <div class="hero-actions">
            <el-button type="primary" @click="scrollToUpload">开始检测</el-button>
            <el-button plain @click="scrollToExplain">系统说明</el-button>
          </div>
        </div>

        <div class="hero-right">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-title">系统概述</div>
            </template>
            <div class="summary-list">
              <div class="summary-item">
                <span class="summary-label">项目名称</span>
                <span class="summary-value">道路病害视频分析平台</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">核心功能</span>
                <span class="summary-value">上传、抽帧、检测、结果查看</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">前端框架</span>
                <span class="summary-value">Vue 3 + Element Plus</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">页面风格</span>
                <span class="summary-value">本科毕业设计展示风格</span>
              </div>
            </div>
          </el-card>
        </div>
      </section>

      <section class="panel-grid three-grid">
        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤一</div>
          <h3>选择检测视频</h3>
          <p>点击上传选择待分析视频文件，页面会显示文件信息与上传状态。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤二</div>
          <h3>设置分析参数</h3>
          <p>根据检测需求设置置信度阈值及抽帧模式，兼顾检测精度与处理效率。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤三</div>
          <h3>进入任务详情</h3>
          <p>提交检测任务后自动跳转到任务详情页面，查看当前分析处理状态。</p>
        </el-card>
      </section>

      <section class="main-grid" ref="uploadSection">
        <el-card shadow="hover" class="upload-card">
          <template #header>
            <div class="card-title">视频上传</div>
          </template>

          <div class="section-tip">
            请先选择需要检测的视频文件，再点击“提交检测任务”开始真实上传并创建任务。
          </div>

          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            accept="video/*"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              将视频拖拽到此处，或 <span>点击上传</span>
            </div>
            <div class="upload-tip">
              支持 MP4 / MOV / AVI 等视频格式，文件大小不超过 500MB
            </div>
          </el-upload>

          <div v-if="selectedFile" class="file-preview">
            <div class="file-name">
              <el-icon><VideoPlay /></el-icon>
              <span>{{ selectedFile.name }}</span>
            </div>
            <div class="file-meta">
              文件大小：{{ formatFileSize(selectedFile.size) }}
            </div>
          </div>

          <div v-if="uploading || uploadProgress > 0" class="progress-wrap">
            <div class="progress-header">
              <span class="progress-label">上传进度</span>
              <span class="progress-percent">{{ uploadProgress }}%</span>
            </div>
            <el-progress
              :percentage="uploadProgress"
              :stroke-width="16"
              :text-inside="true"
              :status="uploadStatus === 'success' ? 'success' : ''"
            />
          </div>

          <div v-if="uploadStatusText" class="upload-status">
            <el-tag :type="uploadStatusTagType" effect="light" size="large">
              {{ uploadStatusText }}
            </el-tag>
          </div>
        </el-card>

        <el-card shadow="hover" class="param-card">
          <template #header>
            <div class="card-title">参数配置</div>
          </template>

          <el-form :model="params" label-width="100px" class="param-form">
            <el-form-item label="置信度">
              <div class="param-row">
                <el-slider
                  v-model="params.confidence"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  show-input
                  :show-input-controls="false"
                />
              </div>
              <div class="param-help">
                置信度用于控制检测结果筛选阈值，数值越高，检测结果越严格。
              </div>
            </el-form-item>

            <el-form-item label="抽帧模式">
              <div class="frame-btn-group">
                <el-button
                  :type="params.frameInterval === 1 ? 'primary' : 'default'"
                  @click="params.frameInterval = 1"
                >
                  高精度抽帧
                </el-button>
                <el-button
                  :type="params.frameInterval === 5 ? 'primary' : 'default'"
                  @click="params.frameInterval = 5"
                >
                  标准抽帧
                </el-button>
                <el-button
                  :type="params.frameInterval === 10 ? 'primary' : 'default'"
                  @click="params.frameInterval = 10"
                >
                  快速抽帧
                </el-button>
              </div>
              <div class="param-help">
                当前设置：每 <b>{{ params.frameInterval }}</b> 帧提取一次进行检测。
              </div>
            </el-form-item>

            <el-form-item label="模式说明">
              <div class="mode-panel">
                <div class="mode-item">
                  <span class="mode-dot dot-blue"></span>
                  <span>高精度抽帧：检测更细致，但处理时间较长</span>
                </div>
                <div class="mode-item">
                  <span class="mode-dot dot-green"></span>
                  <span>标准抽帧：速度和精度均衡，适合大多数情况</span>
                </div>
                <div class="mode-item">
                  <span class="mode-dot dot-orange"></span>
                  <span>快速抽帧：处理更快，适合演示和快速测试</span>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <div class="submit-wrap">
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="submitting"
              @click="submitTask"
            >
              提交检测任务
            </el-button>
          </div>
        </el-card>
      </section>

      <section class="panel-grid two-grid" ref="explainSection">
        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">系统功能说明</div>
          </template>
          <ul class="desc-list">
            <li>支持视频文件选择与检测任务提交。</li>
            <li>支持真实上传进度显示及百分比反馈。</li>
            <li>支持置信度阈值调节与抽帧按钮模式配置。</li>
            <li>支持任务创建成功后自动跳转至任务详情页面。</li>
          </ul>
        </el-card>

        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">使用建议</div>
          </template>
          <ul class="desc-list">
            <li>答辩展示时建议优先使用“标准抽帧”模式。</li>
            <li>若追求更高检测效果，可选择“高精度抽帧”。</li>
            <li>若仅用于快速测试，可选择“快速抽帧”。</li>
            <li>提交任务后可在任务详情页面继续查看处理状态。</li>
          </ul>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, VideoPlay } from '@element-plus/icons-vue'
import { uploadVideo } from '@/api'

const router = useRouter()

const uploadSection = ref(null)
const explainSection = ref(null)

const selectedFile = ref(null)
const uploadProgress = ref(0)
const uploading = ref(false)
const submitting = ref(false)
const uploadStatus = ref('idle') // idle | ready | uploading | success | error

const params = reactive({
  confidence: 0.5,
  frameInterval: 5
})

const uploadStatusText = computed(() => {
  if (uploadStatus.value === 'ready') return '文件已选择'
  if (uploadStatus.value === 'uploading') return '上传中'
  if (uploadStatus.value === 'success') return '上传完成'
  if (uploadStatus.value === 'error') return '上传失败'
  return ''
})

const uploadStatusTagType = computed(() => {
  if (uploadStatus.value === 'ready') return 'info'
  if (uploadStatus.value === 'uploading') return 'warning'
  if (uploadStatus.value === 'success') return 'success'
  if (uploadStatus.value === 'error') return 'danger'
  return 'info'
})

function scrollToUpload() {
  uploadSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function scrollToExplain() {
  explainSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function beforeUpload(file) {
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isVideo) {
    ElMessage.error('上传文件必须为视频格式')
    return false
  }

  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB')
    return false
  }

  return true
}

function handleFileChange(uploadFile) {
  const rawFile = uploadFile.raw || uploadFile
  if (!rawFile) return

  selectedFile.value = rawFile
  uploadProgress.value = 0
  uploadStatus.value = 'ready'
  ElMessage.success('文件选择成功')
}

async function submitTask() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  submitting.value = true
  uploading.value = true
  uploadStatus.value = 'uploading'
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('confidence', params.confidence)
    formData.append('frameInterval', params.frameInterval)

    const res = await uploadVideo(formData, {
      onUploadProgress(progressEvent) {
        if (progressEvent.total) {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      }
    })

    uploadProgress.value = 100
    uploadStatus.value = 'success'

    const taskId =
      res.data.task_id ||
      res.data.taskId ||
      res.data.data?.task_id ||
      res.data.data?.taskId

    if (!taskId) {
      ElMessage.error('后端没有返回 task_id，无法跳转到任务详情页面')
      console.error('上传接口返回数据:', res.data)
      return
    }

    ElMessage.success('检测任务提交成功，正在跳转到任务详情页面')

    router.push({
      name: 'TaskDetail',
      params: { taskId }
    })
  } catch (error) {
    uploadStatus.value = 'error'
    console.error('检测任务提交失败:', error)
    ElMessage.error('检测任务提交失败')
  } finally {
    submitting.value = false
    uploading.value = false
  }
}

function formatFileSize(size) {
  if (!size && size !== 0) return '--'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
  padding: 28px;
  box-sizing: border-box;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.hero-section {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 22px;
}

.hero-left {
  background: #ffffff;
  border-radius: 18px;
  padding: 30px 32px;
  box-shadow: 0 8px 24px rgba(46, 79, 120, 0.08);
  border: 1px solid #e8eef6;
}

.hero-badge {
  display: inline-block;
  padding: 6px 14px;
  background: #edf4ff;
  color: #2f6bdb;
  border-radius: 999px;
  font-size: 13px;
  margin-bottom: 16px;
}

.hero-title {
  margin: 0 0 16px;
  font-size: 30px;
  line-height: 1.4;
  color: #22324d;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: #5d6b82;
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-card,
.upload-card,
.param-card,
.info-card,
.desc-card {
  border-radius: 18px;
  border: 1px solid #e9eef5;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e8edf5;
  font-size: 14px;
}

.summary-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.summary-label {
  color: #64748b;
  white-space: nowrap;
}

.summary-value {
  color: #22324d;
  text-align: right;
  font-weight: 500;
}

.panel-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 22px;
}

.three-grid {
  grid-template-columns: repeat(3, 1fr);
}

.two-grid {
  grid-template-columns: repeat(2, 1fr);
}

.info-card {
  min-height: 160px;
}

.info-card h3 {
  margin: 8px 0 10px;
  font-size: 18px;
  color: #22324d;
}

.info-card p {
  margin: 0;
  line-height: 1.9;
  color: #5f6c80;
  font-size: 14px;
}

.mini-title {
  font-size: 13px;
  color: #2f6bdb;
  font-weight: 600;
}

.main-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
  margin-bottom: 22px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #22324d;
}

.section-tip {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.8;
}

.upload-area {
  width: 100%;
}

:deep(.upload-area .el-upload) {
  width: 100%;
}

:deep(.upload-area .el-upload-dragger) {
  width: 100%;
  height: 220px;
  border-radius: 16px;
  border: 1.5px dashed #7ba7ea;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7fd 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 46px;
  color: #4d7fe6;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #3b4a62;
}

.upload-text span {
  color: #2f6bdb;
  font-weight: 600;
}

.upload-tip {
  margin-top: 10px;
  font-size: 13px;
  color: #8090a6;
}

.file-preview {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7faff;
  border: 1px solid #e4edf9;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #22324d;
  font-weight: 600;
  margin-bottom: 6px;
}

.file-meta {
  font-size: 13px;
  color: #6c7a90;
}

.progress-wrap {
  margin-top: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #4b5b75;
}

.progress-percent {
  font-size: 14px;
  font-weight: 700;
  color: #2f6bdb;
}

.upload-status {
  margin-top: 14px;
}

.param-form {
  margin-top: 4px;
}

.param-row {
  width: 100%;
  padding-right: 12px;
}

.param-help {
  margin-top: 8px;
  color: #73839a;
  font-size: 13px;
  line-height: 1.8;
}

.frame-btn-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-panel {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4e5d74;
  font-size: 14px;
  line-height: 1.9;
}

.mode-item + .mode-item {
  margin-top: 8px;
}

.mode-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.dot-blue {
  background: #4d7fe6;
}

.dot-green {
  background: #3cb371;
}

.dot-orange {
  background: #f59e0b;
}

.submit-wrap {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  border-radius: 12px;
  font-size: 16px;
  height: 46px;
}

.desc-list {
  margin: 0;
  padding-left: 18px;
  color: #55657b;
  line-height: 2;
  font-size: 14px;
}

@media (max-width: 1100px) {
  .hero-section,
  .main-grid,
  .three-grid,
  .two-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 16px;
  }

  .hero-left {
    padding: 22px 20px;
  }

  .hero-title {
    font-size: 24px;
  }

  .frame-btn-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>