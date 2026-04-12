// 建议在你的 src/views/ 目录下创建一个 Home.vue 包含以下逻辑
<template>
  <div class="upload-container">
    <el-upload
      drag
      action="https://road-damage-backend-1.onrender.com/api/upload"
      :on-success="handleSuccess"
      :data="uploadParams"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将视频拖到此处，或<em>点击上传</em></div>
    </el-upload>

    <div v-if="taskRunning">
      <el-progress :percentage="progress" />
      <p>{{ statusMessage }}</p>
    </div>

    <video v-if="resultUrl" :src="resultUrl" controls width="100%" />
  </div>
</template>

<script setup>
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