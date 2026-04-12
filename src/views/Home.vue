<template>
  <div class="home-container">
    <div class="hero-card">
      <h1 class="main-title">道路病害智能检测系统</h1>
      <p class="sub-title">基于 YOLOv8 与深度学习的视觉分析平台</p>

      <div class="upload-wrapper">
        <UploadPanel @submitted="onTaskCreated" />
      </div>

      <el-row :gutter="20" class="features">
        <el-col :span="8">
          <div class="feature-item">
            <el-icon :size="30"><Monitor /></el-icon>
            <h3>实时分析</h3>
            <p>通过 WebSocket 实时查看推理画面与病害标注</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="feature-item">
            <el-icon :size="30"><DataAnalysis /></el-icon>
            <h3>精准统计</h3>
            <p>自动分类各类裂缝、坑洞，并生成统计报表</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="feature-item">
            <el-icon :size="30"><FolderChecked /></el-icon>
            <h3>持久存储</h3>
            <p>任务信息写入 JSON 存根，支持历史结果回溯</p>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Monitor, DataAnalysis, FolderChecked } from '@element-plus/icons-vue'
import UploadPanel from '../components/UploadPanel.vue'

const router = useRouter()

const onTaskCreated = (res) => {
  // 核心逻辑：上传成功后拿到 task_id，跳转到检测详情页
  if (res.task_id) {
    router.push(`/online/${res.task_id}`)
  }
}
</script>

<style scoped>
.home-container {
  padding-top: 60px;
  background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);
  min-height: calc(100vh - 60px);
}
.hero-card {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}
.main-title { font-size: 32px; color: #1a1a1a; margin-bottom: 10px; }
.sub-title { color: #666; margin-bottom: 40px; }
.upload-wrapper {
  background: #fff;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}
.features { margin-top: 60px; }
.feature-item {
  padding: 20px;
  background: transparent;
}
.feature-item h3 { margin: 15px 0 10px; font-size: 18px; }
.feature-item p { font-size: 14px; color: #888; }
</style>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';

const taskRunning = ref(false);
const progress = ref(0);
const statusMessage = ref('');
const resultUrl = ref('');
const uploadParams = { mode: 'online', confidence: 0.5 };

let socket;

onMounted(() => {
  // 连接后端 WebSocket (对应你 main.py 中的 ws_router)
  socket = io('https://road-damage-backend-1.onrender.com');

  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });

  // 关键：监听任务进度更新
  socket.on('task_progress', (data) => {
    // data 格式: { task_id: 'xxx', progress: 45, message: '正在检测...' }
    progress.value = data.progress;
    statusMessage.value = data.message;

    if (data.progress === 100) {
      taskRunning.value = false;
      // 这里的路径要和后端 main.py 挂载的 static 路径一致
      resultUrl.value = `https://road-damage-backend-1.onrender.com/static/outputs/${data.task_id}/result.mp4`;
    }
  });
});

const handleSuccess = (response) => {
  console.log('上传成功，任务ID:', response.task_id);
  taskRunning.value = true;
  // 告诉后端我们要监听这个 task_id
  socket.emit('join_task_room', { task_id: response.task_id });
};
</script>