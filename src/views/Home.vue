<template>
  <el-container class="home-container">
    <!-- 页面标题 -->
    <el-header>
      <h1 class="title">道路缺陷检测系统</h1>
      <p class="subtitle">上传视频 → 设置参数 → 提交检测 → 查看任务进度</p>
    </el-header>

    <el-main>
      <!-- 上传模块 -->
      <el-card class="card upload-card" shadow="hover">
        <div slot="header" class="card-header">上传视频</div>
        <el-upload
          class="upload-demo"
          :http-request="handleUpload"
          :before-upload="beforeUpload"
          :on-success="onUploadSuccess"
          :on-progress="onUploadProgress"
          :file-list="fileList"
          drag
          multiple
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将视频拖到此处，或 <em>点击上传</em></div>
          <div class="el-upload__tip">仅支持 MP4、MOV 文件，最大 500MB</div>
        </el-upload>
        <el-progress
          v-if="uploadProgress > 0"
          :percentage="uploadProgress"
          status="active"
          style="margin-top: 10px;"
        />
      </el-card>

      <!-- 参数设置模块 -->
      <el-card class="card param-card" shadow="hover">
        <div slot="header" class="card-header">参数设置</div>
        <el-form :model="params" label-width="120px">
          <el-form-item label="置信度阈值">
            <el-input-number v-model="params.confidence" :min="0" :max="1" :step="0.05" />
          </el-form-item>

          <el-form-item label="抽帧间隔">
            <el-button-group>
              <el-button
                :type="params.frameInterval === 1 ? 'primary' : 'default'"
                @click="params.frameInterval = 1"
              >快速模式(1帧)</el-button>
              <el-button
                :type="params.frameInterval === 5 ? 'primary' : 'default'"
                @click="params.frameInterval = 5"
              >标准模式(5帧)</el-button>
              <el-button
                :type="params.frameInterval === 10 ? 'primary' : 'default'"
                @click="params.frameInterval = 10"
              >精细模式(10帧)</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>

        <el-button
          type="primary"
          :loading="loading"
          @click="submitTask"
          class="submit-btn"
        >提交检测</el-button>
      </el-card>

      <!-- 历史任务 -->
      <el-card class="card task-card" shadow="hover">
        <div slot="header" class="card-header">历史任务</div>
        <el-table :data="tasks" style="width: 100%">
          <el-table-column prop="id" label="任务ID" width="150" />
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="goToTask(row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { uploadVideo } from '@/api/index.js'

const router = useRouter()
const fileList = ref([])
const loading = ref(false)
const tasks = ref([])
const uploadProgress = ref(0)

const params = reactive({
  confidence: 0.5,
  frameInterval: 5
})

function beforeUpload(file) {
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isVideo) ElMessage.error('文件必须为视频格式')
  if (!isLt500M) ElMessage.error('文件大小不能超过 500MB')
  return isVideo && isLt500M
}

function handleUpload({ file }) {
  fileList.value = [file]
}

function onUploadProgress(event) {
  if (event.lengthComputable)
    uploadProgress.value = Math.round((event.loaded * 100) / event.total)
}

function onUploadSuccess() {
  ElMessage.success('上传成功')
}

async function submitTask() {
  if (!fileList.value.length) return ElMessage.warning('请先上传视频')
  loading.value = true
  const formData = new FormData()
  formData.append('file', fileList.value[0])
  formData.append('confidence', params.confidence)
  formData.append('frameInterval', params.frameInterval)
  try {
    const res = await uploadVideo(formData)
    ElMessage.success('任务提交成功')
    router.push({ name: 'TaskDetail', params: { id: res.data.taskId } })
  } catch (err) {
    ElMessage.error('任务提交失败')
  } finally {
    loading.value = false
  }
}

function goToTask(id) {
  router.push({ name: 'TaskDetail', params: { id } })
}

function statusType(status) {
  switch (status) {
    case 'Completed': return 'success'
    case 'Processing': return 'warning'
    case 'Failed': return 'danger'
    default: return 'info'
  }
}
</script>

<style scoped>
.home-container {
  padding: 40px;
  background: #f9f9f9;
  min-height: 100vh;
}
.title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}
.subtitle {
  text-align: center;
  color: #555;
  font-size: 16px;
  margin-bottom: 40px;
}
.card {
  border-radius: 16px;
  margin-bottom: 30px;
}
.card-header {
  font-size: 18px;
  font-weight: 600;
}
.upload-card .el-upload {
  border: 1px dashed #409EFF;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}
.el-upload__text em {
  color: #409EFF;
  font-style: normal;
}
.submit-btn {
  width: 100%;
  margin-top: 20px;
  font-size: 18px;
  border-radius: 8px;
}
</style>