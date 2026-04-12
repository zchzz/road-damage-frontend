<template>
  <div class="page">
    <div class="container">
      <h1>道路病害检测系统</h1>
      <p class="desc">
        支持在线解析与离线解析，基于 YOLOv8 完成道路病害视频检测。
      </p>

      <UploadPanel @submitted="handleSubmitted" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import UploadPanel from '../components/UploadPanel.vue'
import { useTaskStore } from '../store/taskStore'

const router = useRouter()
const taskStore = useTaskStore()

function handleSubmitted(res) {
  taskStore.setTask({
    taskId: res.task_id,
    mode: res.mode,
    status: res.status
  })

  if (res.mode === 'online') {
    router.push(`/online/${res.task_id}`)
  } else {
    router.push(`/offline/${res.task_id}`)
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40px 20px;
}
.container {
  max-width: 960px;
  margin: 0 auto;
}
h1 {
  text-align: center;
  margin-bottom: 12px;
}
.desc {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}
</style>