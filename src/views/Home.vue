<template>
  <el-container class="home-container" style="padding: 40px; background-color: #f8f9fa; min-height: 100vh;">
    <!-- 页面标题 -->
    <el-header style="background: none; padding: 0; margin-bottom: 40px;">
      <h2 style="color: #333333; font-weight: 700; font-size: 28px; text-align: center;">道路缺陷检测系统</h2>
      <p style="color: #555555; text-align: center; font-size: 16px;">上传视频 → 设置参数 → 提交检测 → 查看任务进度</p>
    </el-header>

    <el-main>
      <el-card shadow="hover" class="upload-card" style="border-radius: 16px;">
        <div slot="header" style="font-size: 18px; font-weight: 600;">上传视频</div>

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
          style="width: 100%; border: 1px dashed #409EFF; border-radius: 12px; padding: 20px;"
        >
          <i class="el-icon-upload" style="font-size: 40px; color: #409EFF;"></i>
          <div class="el-upload__text" style="font-size: 16px; color: #409EFF;">将视频拖到此处，或 <em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip" style="font-size: 12px; color: #999999;">仅支持 MP4、MOV 等视频文件，最大 500MB</div>
        </el-upload>

        <!-- 上传进度条 -->
        <el-progress v-if="uploadProgress > 0" :percentage="uploadProgress" status="active" style="margin-top: 20px; border-radius: 8px;" />

        <!-- 参数设置表单 -->
        <el-form :model="params" label-width="150px" style="margin-top: 30px;">
          <el-form-item label="置信度阈值" style="font-size: 16px;">
            <el-input-number v-model="params.confidence" :min="0" :max="1" :step="0.05" style="width: 100%;" />
          </el-form-item>

          <!-- 抽帧间隔设置 -->
          <el-form-item label="抽帧间隔" style="font-size: 16px;">
            <el-input-number v-model="params.frameInterval" :min="1" :max="60" style="width: 100%;" />
            <span class="el-form-item__label-helper" style="font-size: 12px; color: #666666;">每多少帧提取一次进行检测</span>
          </el-form-item>
        </el-form>

        <!-- 提交按钮 -->
        <el-button
          type="primary"
          :loading="loading"
          @click="submitTask"
          style="margin-top: 20px; width: 100%; padding: 12px 0; font-size: 18px; background-color: #409EFF; border-radius: 8px;"
        >
          提交检测
        </el-button>
      </el-card>

      <!-- 已上传任务列表 -->
      <el-card shadow="hover" style="margin-top: 40px; border-radius: 16px;">
        <div slot="header" style="font-size: 18px; font-weight: 600;">历史任务</div>
        <el-table :data="tasks" style="width: 100%">
          <el-table-column prop="id" label="任务ID" width="150" />
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="statusType(row.status)"
                effect="plain"
                style="font-size: 14px; font-weight: 500; color: #fff;"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="goToTask(row.id)" style="border-radius: 8px;">查看</el-button>
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
  frameInterval: 5, // 默认抽帧间隔为 5
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
    formData.append('frameInterval', params.frameInterval) // 把抽帧间隔传给后端

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
  font-size: 28px;
  margin-bottom: 8px;
}

.el-upload__text em {
  color: #409EFF;
  font-style: normal;
}

.el-upload__tip {
  color: #999999;
}

.upload-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.el-button {
  font-weight: 600;
  background-color: #409EFF;
}

.el-button:hover {
  background-color: #3385cc;
}

.el-form-item__label-helper {
  color: #666666;
  font-size: 12px;
}

.el-table .cell {
  font-size: 14px;
}
</style>