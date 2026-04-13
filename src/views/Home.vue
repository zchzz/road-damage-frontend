<template>
  <MainLayout>
    <PageContainer>
      <div class="theme-page">
        <section class="theme-hero">
          <div class="theme-hero__main">
            <div class="theme-badge">Road Damage Detection</div>
            <h1 class="theme-title">道路病害检测工作台</h1>
            <p class="theme-desc">
              上传道路视频，提交到公网后端，由本地 worker 领取任务并完成真实检测。
              任务提交后可直接进入详情页查看进度、结果预览与文件下载。
            </p>

            <div class="theme-chip-row">
              <span class="theme-chip">Render 公网后端</span>
              <span class="theme-chip">本地 Worker 真实检测</span>
              <span class="theme-chip">结果统一查看与下载</span>
            </div>
          </div>

          <div class="theme-hero__side">
            <div class="theme-panel upload-panel">
              <div class="theme-panel__head">提交检测任务</div>
              <p class="theme-panel__sub">
                支持视频上传、检测阈值设置、抽帧设置和任务模式配置。
              </p>

              <el-form label-position="top" class="upload-form">
                <el-form-item label="选择视频文件">
                  <el-upload
                    class="upload-box"
                    drag
                    :auto-upload="false"
                    :show-file-list="true"
                    :limit="1"
                    :on-change="handleFileChange"
                    :on-remove="handleFileRemove"
                    accept="video/*"
                  >
                    <el-icon class="el-icon--upload">
                      <UploadFilled />
                    </el-icon>
                    <div class="el-upload__text">
                      将视频拖到此处，或 <em>点击选择文件</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        建议上传 mp4 / mov / avi / mkv / webm / m4v
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>

                <el-form-item label="置信度阈值">
                  <el-slider
                    v-model="form.confidence"
                    :min="0.05"
                    :max="1"
                    :step="0.05"
                    show-input
                  />
                </el-form-item>

                <el-form-item label="抽帧间隔">
                  <el-input-number
                    v-model="form.skipFrames"
                    :min="1"
                    :max="30"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="任务模式">
                  <el-radio-group v-model="form.mode">
                    <el-radio-button label="real">真实检测</el-radio-button>
                    <el-radio-button label="smoke">Smoke 测试</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <div class="upload-actions">
                  <el-button @click="goTaskDocs">查看任务说明</el-button>
                  <el-button
                    type="primary"
                    :loading="submitting"
                    @click="submitTask"
                  >
                    上传并开始分析
                  </el-button>
                </div>
              </el-form>
            </div>
          </div>
        </section>

        <section class="theme-grid-two">
          <div class="theme-panel">
            <div class="theme-panel__head">核心能力</div>
            <p class="theme-panel__sub">围绕上传、检测、追踪和结果交付做统一收口。</p>

            <div class="theme-list">
              <div class="theme-list-item">
                <span class="theme-list-item__title">公网任务入口</span>
                <span class="theme-list-item__value">
                  前端上传后直接写入 Render 后端任务队列。
                </span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">本地高算力处理</span>
                <span class="theme-list-item__value">
                  由你电脑上的 worker 领取任务并调用本地模型做真实检测。
                </span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">结果统一交付</span>
                <span class="theme-list-item__value">
                  返回标注视频、JSON 结果和 HTML 报告。
                </span>
              </div>
            </div>
          </div>

          <div class="theme-panel">
            <div class="theme-panel__head">标准流程</div>
            <p class="theme-panel__sub">建议按下面流程完成一次完整检测。</p>

            <div class="theme-list">
              <div class="theme-list-item">
                <span class="theme-list-item__title">01 上传视频</span>
                <span class="theme-list-item__value">设置 confidence、skip_frames 和 mode。</span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">02 进入详情页</span>
                <span class="theme-list-item__value">查看任务状态、进度和 worker 处理情况。</span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">03 查看结果</span>
                <span class="theme-list-item__value">在当前页预览视频 / JSON / HTML，并支持下载。</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadVideo } from '@/api'

const router = useRouter()

const selectedFile = ref(null)
const submitting = ref(false)

const form = reactive({
  confidence: 0.25,
  skipFrames: 1,
  mode: 'real'
})

function handleFileChange(file) {
  selectedFile.value = file?.raw || null
}

function handleFileRemove() {
  selectedFile.value = null
}

function goTaskDocs() {
  ElMessage.info('上传任务后会自动进入任务详情页')
}

async function submitTask() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('confidence', String(form.confidence))
  formData.append('skip_frames', String(form.skipFrames))
  formData.append('mode', form.mode)

  submitting.value = true

  try {
    const { data } = await uploadVideo(formData)
    const taskId = data?.task_id

    if (!taskId) {
      throw new Error('后端未返回 task_id')
    }

    ElMessage.success('任务提交成功')
    router.push(`/task/${taskId}`)
  } catch (error) {
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      '上传失败，请稍后重试'
    ElMessage.error(detail)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.theme-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.theme-hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  align-items: stretch;
}

.theme-hero__main,
.theme-hero__side,
.theme-panel {
  background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.78));
  border: 1px solid rgba(255,255,255,0.65);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 18px 50px rgba(31, 41, 55, 0.08);
}

.theme-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.10);
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 14px;
}

.theme-title {
  margin: 0 0 14px;
  font-size: 34px;
  line-height: 1.2;
  color: #0f172a;
}

.theme-desc {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  font-size: 15px;
}

.theme-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.theme-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 500;
}

.theme-grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.theme-panel__head {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.theme-panel__sub {
  color: #64748b;
  line-height: 1.7;
  font-size: 14px;
  margin-bottom: 18px;
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.theme-list-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid #e2e8f0;
}

.theme-list-item__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.theme-list-item__value {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

.upload-panel {
  height: 100%;
}

.upload-form {
  margin-top: 8px;
}

.upload-box {
  width: 100%;
}

.upload-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .theme-hero,
  .theme-grid-two {
    grid-template-columns: 1fr;
  }

  .theme-title {
    font-size: 28px;
  }
}
</style>