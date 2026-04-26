<template>
  <el-container class="home-container" style="padding: 24px; background-color: #f9f9f9; min-height: 100vh;">
    <!-- 页面标题 -->
    <el-header style="background: none; padding: 0; margin-bottom: 24px;">
      <h2 style="color: #333333;">道路缺陷检测系统</h2>
      <p style="color: #666666;">上传视频 → 设置参数 → 提交检测 → 查看任务进度</p>
    </el-header>

    <el-main>
      <el-card shadow="hover" style="margin-bottom: 24px; border-radius: 12px;">
        <div slot="header">
          <span>上传视频</span>
        </div>

        <!-- 文件上传区域 -->
        <el-upload
          class="upload-demo"
          :http-request="handleUpload"
          :before-upload="beforeUpload"
          :on-success="onUploadSuccess"
          :on-progress="onUploadProgress"
          :file-list="fileList"
          drag
          multiple
          style="width: 100%;"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将视频拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">仅支持 MP4、MOV 等视频文件，最大 500MB</div>
        </el-upload>

        <!-- 上传进度条 -->
        <el-progress v-if="uploadProgress > 0" :percentage="uploadProgress" status="active" />

        <el-form :model="params" label-width="120px" style="margin-top: 16px;">
          <el-form-item label="置信度阈值">
            <el-input-number v-model="params.confidence" :min="0" :max="1" :step="0.05" />
          </el-form-item>
        </el-form>

        <el-button type="primary" :loading="loading" @click="submitTask" style="margin-top: 16px; border-radius: 8px;">
          提交检测
        </el-button>
      </el-card>

      <!-- 已上传任务列表 -->
      <el-card shadow="hover" style="border-radius: 12px;">
        <div slot="header">
          <span>历史任务</span>
        </div>
        <el-table :data="tasks" style="width: 100%">
          <el-table-column prop="id" label="任务ID" width="150" />
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="statusType(row.status)"
                effect="plain"
              >
                {{ row.status }}
              </el-tag>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { uploadVideo, getTask } from '@/api/index.js'

const router = useRouter()

const fileList = ref([])
const loading = ref(false)
const tasks = ref([])
const uploadProgress = ref(0)

const params = reactive({
  confidence: 0.5,
})

// 文件上传前校验
function beforeUpload(file) {
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isVideo) {
    ElMessage.error('上传文件必须为视频格式!')
  }
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB!')
  }
  return isVideo && isLt500M
}

// 自定义上传处理
async function handleUpload({ file }) {
  // 文件暂存到 fileList，不直接上传
  fileList.value = [file]
}

// 上传进度
function onUploadProgress(event, file, fileList) {
  if (event.lengthComputable) {
    uploadProgress.value = Math.round((event.loaded * 100) / event.total)
  }
}

// 上传成功后
function onUploadSuccess(response, file) {
  fileList.value.push(file)
}

// 提交检测任务
async function submitTask() {
  if (!fileList.value.length) {
    ElMessage.warning('请先上传视频文件!')
    return
  }
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', fileList.value[0])
    formData.append('confidence', params.confidence)

    const res = await uploadVideo(formData)
    ElMessage.success('任务提交成功!')
    goToTask(res.data.taskId)
  } catch (error) {
    ElMessage.error('任务提交失败!')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 跳转任务详情页
function goToTask(taskId) {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

// 页面挂载加载历史任务
onMounted(async () => {
  // 这里可根据后端接口获取历史任务
  // 示例:
  // const res = await getTaskList()
  // tasks.value = res.data.tasks
})
</script>

<style scoped>
.home-container h2 {
  font-weight: 600;
  font-size: 24px;
}
.el-upload__text em {
  color: #409EFF;
  font-style: normal;
}
.el-upload__tip {
  color: #999999;
}
</style>