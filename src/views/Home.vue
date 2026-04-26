<template>
  <div class="home-page">
    <div class="page-shell">
      <!-- 顶部介绍 -->
      <section class="hero-section">
        <div class="hero-left">
          <div class="hero-badge">本科毕业设计系统首页</div>
          <h1 class="hero-title">基于深度学习的道路缺陷检测系统</h1>
          <p class="hero-desc">
            本系统用于道路缺陷视频检测任务，支持视频上传、参数配置、抽帧处理、
            检测任务提交及页面跳转，可作为本科毕业设计项目展示首页。
          </p>

          <div class="hero-actions">
            <el-button type="primary" @click="scrollToUpload">开始检测</el-button>
            <el-button plain @click="scrollToTaskInfo">查看功能说明</el-button>
          </div>
        </div>

        <div class="hero-right">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-title">系统概述</div>
            </template>
            <div class="summary-list">
              <div class="summary-item">
                <span class="summary-label">研究对象</span>
                <span class="summary-value">道路缺陷视频检测</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">主要功能</span>
                <span class="summary-value">上传、抽帧、检测、跳转展示</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">前端技术</span>
                <span class="summary-value">Vue 3 + Element Plus</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">系统特点</span>
                <span class="summary-value">界面简洁、流程清晰、适合答辩展示</span>
              </div>
            </div>
          </el-card>
        </div>
      </section>

      <!-- 三步说明 -->
      <section class="panel-grid three-grid">
        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤一</div>
          <h3>上传视频文件</h3>
          <p>通过拖拽或点击方式上传道路视频，系统会实时显示上传百分比。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤二</div>
          <h3>设置检测参数</h3>
          <p>可设置置信度阈值和抽帧模式，以满足不同检测效率与精度需求。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤三</div>
          <h3>提交检测任务</h3>
          <p>文件上传完成后提交检测任务，并自动跳转到检测页面查看处理进度。</p>
        </el-card>
      </section>

      <!-- 上传与参数 -->
      <section class="main-grid" ref="uploadSection">
        <!-- 上传区 -->
        <el-card shadow="hover" class="upload-card">
          <template #header>
            <div class="card-title">视频上传</div>
          </template>

          <div class="section-tip">
            请上传待检测视频文件。上传完成后，系统会显示“上传完成”状态，再进行任务提交。
          </div>

          <el-upload
            class="upload-area"
            drag
            :http-request="handleUpload"
            :before-upload="beforeUpload"
            :show-file-list="false"
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
            <el-tag
              :type="uploadStatusTagType"
              effect="light"
              size="large"
            >
              {{ uploadStatusText }}
            </el-tag>
          </div>
        </el-card>

        <!-- 参数区 -->
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
                置信度用于控制检测结果筛选阈值，数值越高，筛选越严格。
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
                  <span>标准抽帧：速度和精度较为均衡，适合大多数情况</span>
                </div>
                <div class="mode-item">
                  <span class="mode-dot dot-orange"></span>
                  <span>快速抽帧：处理速度快，适合测试或答辩演示</span>
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

      <!-- 功能说明 -->
      <section class="panel-grid two-grid" ref="taskInfoSection">
        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">系统功能说明</div>
          </template>
          <ul class="desc-list">
            <li>支持道路检测视频文件上传，并显示真实上传百分比。</li>
            <li>支持设置检测置信度阈值，提高检测结果可控性。</li>
            <li>支持抽帧按钮模式设置，便于平衡检测精度与处理效率。</li>
            <li>支持上传完成后提交检测任务并跳转至检测页面。</li>
          </ul>
        </el-card>

        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">使用建议</div>
          </template>
          <ul class="desc-list">
            <li>答辩演示建议选择“标准抽帧”模式，效果较为稳定。</li>
            <li>若视频较大，可先上传完成后再提交检测任务。</li>
            <li>若追求更高检测效果，可使用“高精度抽帧”模式。</li>
            <li>若仅用于快速测试，可使用“快速抽帧”模式。</li>
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
import axios from 'axios'

const router = useRouter()

const uploadSection = ref(null)
const taskInfoSection = ref(null)

const selectedFile = ref(null)
const uploadedFileUrl = ref('')
const uploadProgress = ref(0)
const uploading = ref(false)
const submitting = ref(false)
const uploadStatus = ref('idle') // idle | uploading | success | error

const params = reactive({
  confidence: 0.5,
  frameInterval: 5,
})

const uploadStatusText = computed(() => {
  if (uploadStatus.value === 'uploading') return '上传中'
  if (uploadStatus.value === 'success') return '上传完成'
  if (uploadStatus.value === 'error') return '上传失败'
  return ''
})

const uploadStatusTagType = computed(() => {
  if (uploadStatus.value === 'uploading') return 'warning'
  if (uploadStatus.value === 'success') return 'success'
  if (uploadStatus.value === 'error') return 'danger'
  return 'info'
})

function scrollToUpload() {
  uploadSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function scrollToTaskInfo() {
  taskInfoSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function beforeUpload(file) {
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isVideo) {
    ElMessage.error('上传文件必须为视频格式')
  }

  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB')
  }

  return isVideo && isLt500M
}

/**
 * 真实上传文件
 * 这里默认上传接口为 /api/upload
 * 你如果后端地址不同，改这一行即可
 */
async function handleUpload(option) {
  const { file, onSuccess, onError } = option

  selectedFile.value = file
  uploadedFileUrl.value = ''
  uploadProgress.value = 0
  uploadStatus.value = 'uploading'
  uploading.value = true

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress(progressEvent) {
        if (progressEvent.total) {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      },
    })

    uploadedFileUrl.value = res.data.fileUrl || res.data.url || ''
    uploadProgress.value = 100
    uploadStatus.value = 'success'
    ElMessage.success('文件上传完成')

    if (onSuccess) onSuccess(res.data)
  } catch (error) {
    uploadStatus.value = 'error'
    ElMessage.error('文件上传失败')
    if (onError) onError(error)
  } finally {
    uploading.value = false
  }
}

/**
 * 提交检测任务
 * 默认接口为 /api/detect
 * 如果你的后端不同，改这里即可
 */
async function submitTask() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  if (uploadStatus.value !== 'success') {
    ElMessage.warning('请先完成文件上传')
    return
  }

  if (!uploadedFileUrl.value) {
    ElMessage.warning('未获取到上传文件地址，请检查上传接口返回值')
    return
  }

  submitting.value = true

  try {
    const res = await axios.post('/api/detect', {
      fileUrl: uploadedFileUrl.value,
      confidence: params.confidence,
      frameInterval: params.frameInterval,
      fileName: selectedFile.value.name,
    })

    ElMessage.success('检测任务提交成功，正在跳转到检测页面')

    // 默认跳转到 DetectVideo 页面
    // taskId 放在 query 中，兼容性更好
    router.push({
      name: 'DetectVideo',
      query: {
        taskId: res.data.taskId,
      },
    })
  } catch (error) {
    console.error(error)
    ElMessage.error('检测任务提交失败')
  } finally {
    submitting.value = false
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