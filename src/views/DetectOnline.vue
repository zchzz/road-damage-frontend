<template>
  <MainLayout>
    <PageContainer narrow>
      <div class="detect-online-page">
        <section class="page-hero">
          <div class="page-hero__content">
            <div class="page-hero__badge">Online Detection Workspace</div>
            <h1 class="page-hero__title">在线分析</h1>
            <p class="page-hero__desc">
              适用于实时展示型场景。上传视频后，系统将创建检测任务，
              并进入任务详情页实时查看处理进度、检测状态和统计结果。
            </p>
          </div>

          <div class="page-hero__side">
            <div class="mode-card">
              <div class="mode-card__title">模式特性</div>
              <ul class="mode-card__list">
                <li>适合演示与答辩场景</li>
                <li>支持实时状态查看</li>
                <li>处理完成后跳转结果展示</li>
              </ul>
            </div>
          </div>
        </section>

        <SectionCard
          title="创建在线检测任务"
          description="上传视频文件并设置检测参数，提交后自动进入任务详情页。"
        >
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="110px"
            class="detect-form"
          >
            <el-form-item label="视频文件" prop="file">
              <el-upload
                class="upload-block"
                drag
                :auto-upload="false"
                :show-file-list="true"
                :limit="1"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                accept=".mp4,.avi,.mov,.mkv"
              >
                <el-icon class="el-icon--upload">
                  <UploadFilled />
                </el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或 <em>点击上传</em>
                </div>
                <template #tip>
                  <div class="upload-tip">
                    支持 mp4 / avi / mov / mkv，建议上传用于道路病害检测的视频文件
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="分析模式" prop="mode">
                  <el-select v-model="form.mode" style="width: 100%">
                    <el-option label="在线分析" value="online" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="置信度阈值" prop="confidence">
                  <el-slider
                    v-model="form.confidence"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    show-input
                    :show-input-controls="false"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="跳帧数" prop="skipFrames">
                  <el-input-number
                    v-model="form.skipFrames"
                    :min="0"
                    :max="30"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="任务说明">
                  <div class="param-hint">
                    在线模式下，任务创建后会进入任务详情页查看实时状态。
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="action-bar">
              <el-button @click="resetForm" :disabled="submitting">
                重置
              </el-button>
              <el-button
                type="primary"
                :loading="submitting"
                @click="submitForm"
              >
                开始在线分析
              </el-button>
            </div>
          </el-form>
        </SectionCard>

        <div class="page-grid">
          <SectionCard
            title="参数建议"
            description="用于提升演示体验与任务稳定性。"
          >
            <ul class="info-list">
              <li>答辩演示建议使用时长较短、内容清晰的视频。</li>
              <li>置信度建议从 0.25 ~ 0.50 开始调试。</li>
              <li>跳帧适当增大可降低处理压力，但可能影响检测完整性。</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="在线模式流程"
            description="提交成功后系统的标准处理链路。"
          >
            <div class="flow-mini">
              <div class="flow-mini__item">上传视频</div>
              <div class="flow-mini__arrow">→</div>
              <div class="flow-mini__item">创建任务</div>
              <div class="flow-mini__arrow">→</div>
              <div class="flow-mini__item">进入任务页</div>
              <div class="flow-mini__arrow">→</div>
              <div class="flow-mini__item">查看结果</div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'

import MainLayout from '@/layouts/MainLayout.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import { useUploadTask } from '@/composables/useUploadTask'

const formRef = ref(null)

const form = reactive({
  file: null,
  mode: 'online',
  confidence: 0.25,
  skipFrames: 1
})

const rules = {
  file: [
    {
      required: true,
      validator: (_, value, callback) => {
        if (!value) {
          callback(new Error('请先选择视频文件'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  mode: [
    {
      required: true,
      message: '请选择分析模式',
      trigger: 'change'
    }
  ],
  confidence: [
    {
      required: true,
      message: '请设置置信度阈值',
      trigger: 'change'
    }
  ],
  skipFrames: [
    {
      required: true,
      message: '请设置跳帧数',
      trigger: 'change'
    }
  ]
}

const { submitting, createTask } = useUploadTask()

function handleFileChange(uploadFile) {
  form.file = uploadFile.raw || null
}

function handleFileRemove() {
  form.file = null
}

function resetForm() {
  form.file = null
  form.mode = 'online'
  form.confidence = 0.25
  form.skipFrames = 1
  formRef.value?.clearValidate()
}

async function submitForm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  await createTask({
    file: form.file,
    mode: form.mode,
    confidence: form.confidence,
    skipFrames: form.skipFrames,
    successMessage: '在线检测任务创建成功'
  })
}
</script>

<style scoped>
.detect-online-page {
  padding: 28px 0 40px;
}

.page-hero {
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: 1.35fr 0.8fr;
  gap: 20px;
  align-items: stretch;
}

.page-hero__content,
.page-hero__side {
  min-width: 0;
}

.page-hero__content {
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
}

.page-hero__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.18);
  color: #bfdbfe;
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
  color: rgba(255, 255, 255, 0.78);
}

.mode-card {
  height: 100%;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.mode-card__title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.mode-card__list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 2;
}

.detect-form {
  margin-top: 8px;
}

.upload-block {
  width: 100%;
}

:deep(.upload-block .el-upload) {
  width: 100%;
}

:deep(.upload-block .el-upload-dragger) {
  width: 100%;
  min-height: 180px;
  border-radius: 16px;
}

.upload-tip {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.param-hint {
  min-height: 32px;
  display: flex;
  align-items: center;
  color: #64748b;
  line-height: 1.8;
}

.action-bar {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.page-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.95;
  color: #475569;
}

.flow-mini {
  min-height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: #334155;
}

.flow-mini__item {
  padding: 10px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  font-weight: 600;
}

.flow-mini__arrow {
  color: #94a3b8;
  font-weight: 700;
}

@media (max-width: 992px) {
  .page-hero,
  .page-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detect-online-page {
    padding-top: 20px;
  }

  .page-hero__content,
  .mode-card {
    padding: 20px;
  }

  .page-hero__title {
    font-size: 28px;
  }

  .action-bar {
    justify-content: stretch;
    flex-direction: column;
  }

  .action-bar .el-button {
    width: 100%;
  }
}
</style>