<template>
  <div class="home-page">
    <div class="page-shell">
      <!-- 顶部标题区 -->
      <section class="hero-section">
        <div class="hero-left">
          <div class="hero-badge">本科毕业设计系统</div>
          <h1 class="hero-title">基于深度学习的道路缺陷检测系统</h1>
          <p class="hero-desc">
            本系统面向道路病害视频检测场景，支持视频上传、参数配置、抽帧处理、任务提交、
            检测进度查看与结果展示，可用于毕业设计答辩演示和实验系统展示。
          </p>

          <div class="hero-actions">
            <el-button type="primary" @click="scrollToUpload">开始检测</el-button>
            <el-button plain @click="scrollToTasks">查看历史任务</el-button>
          </div>
        </div>

        <div class="hero-right">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-title">系统概述</div>
            </template>
            <div class="summary-list">
              <div class="summary-item">
                <span class="summary-label">检测对象</span>
                <span class="summary-value">道路视频/图像帧</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">核心功能</span>
                <span class="summary-value">上传、抽帧、检测、结果展示</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">前端框架</span>
                <span class="summary-value">Vue 3 + Element Plus</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">系统特点</span>
                <span class="summary-value">界面简洁、流程清晰、便于演示</span>
              </div>
            </div>
          </el-card>
        </div>
      </section>

      <!-- 系统流程说明 -->
      <section class="panel-grid three-grid">
        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤一</div>
          <h3>上传检测视频</h3>
          <p>选择待检测道路视频文件，系统支持拖拽上传与点击上传两种方式。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤二</div>
          <h3>设置检测参数</h3>
          <p>配置置信度阈值和抽帧模式，平衡检测速度与检测精度。</p>
        </el-card>

        <el-card shadow="hover" class="info-card">
          <div class="mini-title">步骤三</div>
          <h3>提交并查看结果</h3>
          <p>任务提交后可进入详情页查看任务进度、检测结果和处理状态。</p>
        </el-card>
      </section>

      <!-- 上传与参数配置 -->
      <section class="main-grid" ref="uploadSection">
        <el-card shadow="hover" class="upload-card">
          <template #header>
            <div class="card-title">视频上传</div>
          </template>

          <div class="section-tip">
            请上传道路检测视频文件，支持常见视频格式，建议文件大小不超过 500MB。
          </div>

          <el-upload
            class="upload-area"
            drag
            :http-request="handleUpload"
            :before-upload="beforeUpload"
            :on-progress="onUploadProgress"
            :show-file-list="false"
            accept="video/*"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              将视频拖拽到此处，或 <span>点击上传</span>
            </div>
            <div class="upload-tip">
              支持 MP4 / MOV / AVI 等格式，上传后可直接配置检测参数
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

          <div class="progress-wrap" v-if="uploadProgress > 0">
            <div class="progress-label">上传进度</div>
            <el-progress :percentage="uploadProgress" status="active" />
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
                用于控制检测结果的可信程度，数值越高筛选越严格。
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
                当前抽帧间隔：每 <b>{{ params.frameInterval }}</b> 帧提取一次进行检测。
              </div>
            </el-form-item>

            <el-form-item label="模式说明">
              <div class="mode-panel">
                <div class="mode-item">
                  <span class="mode-dot dot-blue"></span>
                  <span>高精度抽帧：适合精细分析，处理时间较长</span>
                </div>
                <div class="mode-item">
                  <span class="mode-dot dot-green"></span>
                  <span>标准抽帧：兼顾效率和精度，适合大多数情况</span>
                </div>
                <div class="mode-item">
                  <span class="mode-dot dot-orange"></span>
                  <span>快速抽帧：处理速度快，适合演示和快速测试</span>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <div class="submit-wrap">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="submitTask"
            >
              提交检测任务
            </el-button>
          </div>
        </el-card>
      </section>

      <!-- 补充说明区 -->
      <section class="panel-grid two-grid">
        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">系统功能说明</div>
          </template>
          <ul class="desc-list">
            <li>支持道路视频上传并进行检测任务提交。</li>
            <li>支持根据检测需求设置置信度阈值与抽帧策略。</li>
            <li>支持任务详情页面跳转与检测流程查看。</li>
            <li>适合作为毕业设计展示系统首页与功能入口页面。</li>
          </ul>
        </el-card>

        <el-card shadow="hover" class="desc-card">
          <template #header>
            <div class="card-title">使用建议</div>
          </template>
          <ul class="desc-list">
            <li>答辩演示时建议优先使用“标准抽帧”模式。</li>
            <li>若视频较长，可选择“快速抽帧”提升处理效率。</li>
            <li>若需要更高检测精度，可使用“高精度抽帧”。</li>
            <li>任务提交后可进入任务详情页查看进度与结果。</li>
          </ul>
        </el-card>
      </section>

      <!-- 历史任务 -->
      <section ref="taskSection">
        <el-card shadow="hover" class="task-card">
          <template #header>
            <div class="card-title">历史任务记录</div>
          </template>

          <div class="section-tip">
            该区域用于展示历史检测任务信息，便于进入任务详情页面继续查看处理状态。
          </div>

          <el-table :data="tasks" style="width: 100%" empty-text="暂无历史任务">
            <el-table-column prop="id" label="任务ID" min-width="180" />
            <el-table-column prop="fileName" label="文件名" min-width="220" />
            <el-table-column prop="status" label="任务状态" width="140">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" effect="light">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="goToTask(row.id)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, VideoPlay } from '@element-plus/icons-vue'
import { uploadVideo } from '@/api/index.js'

const router = useRouter()

const fileList = ref([])
const selectedFile = ref(null)
const loading = ref(false)
const tasks = ref([])
const uploadProgress = ref(0)

const uploadSection = ref(null)
const taskSection = ref(null)

const params = reactive({
  confidence: 0.5,
  frameInterval: 5,
})

function scrollToUpload() {
  uploadSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToTasks() {
  taskSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

async function handleUpload({ file }) {
  selectedFile.value = file
  fileList.value = [file]

  // 这里模拟选择文件后的进度显示效果
  // 如果你的后端上传接口本身支持 progress 回调，可以替换成真实上传进度
  uploadProgress.value = 0
  const timer = setInterval(() => {
    if (uploadProgress.value >= 100) {
      clearInterval(timer)
    } else {
      uploadProgress.value += 10
    }
  }, 80)
}

function onUploadProgress(event) {
  if (event?.lengthComputable) {
    uploadProgress.value = Math.round((event.loaded * 100) / event.total)
  }
}

async function submitTask() {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传视频文件')
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('confidence', params.confidence)
    formData.append('frameInterval', params.frameInterval)

    const res = await uploadVideo(formData)
    ElMessage.success('任务提交成功')

    router.push({
      name: 'TaskDetail',
      params: { id: res.data.taskId },
    })
  } catch (error) {
    ElMessage.error('任务提交失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function goToTask(id) {
  router.push({
    name: 'TaskDetail',
    params: { id },
  })
}

function statusType(status) {
  switch (status) {
    case '已完成':
    case 'Completed':
      return 'success'
    case '处理中':
    case 'Processing':
      return 'warning'
    case '失败':
    case 'Failed':
      return 'danger'
    default:
      return 'info'
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

.hero-left,
.hero-right {
  min-width: 0;
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
.desc-card,
.task-card {
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

.progress-label {
  font-size: 14px;
  color: #4b5b75;
  margin-bottom: 8px;
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