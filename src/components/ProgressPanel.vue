<template>
  <el-card shadow="hover">
    <template #header>
      <div class="title">任务进度</div>
    </template>

    <div class="row">
      <span>任务状态：</span>
      <StatusTag :status="status" />
    </div>

    <div class="row">
      <span>当前信息：</span>
      <span>{{ message || '等待开始' }}</span>
    </div>

    <div class="row">
      <span>处理进度：</span>
      <span>{{ progress }}%</span>
    </div>

    <el-progress :percentage="progress" />

    <div class="row">
      <span>当前帧：</span>
      <span>{{ currentFrame }}</span>
    </div>

    <div class="row">
      <span>总帧数：</span>
      <span>{{ totalFrames }}</span>
    </div>
  </el-card>
</template>

<script setup>
import StatusTag from './StatusTag.vue'

defineProps({
  status: String,
  message: String,
  progress: Number,
  currentFrame: Number,
  totalFrames: Number
})
</script>

<style scoped>
.title {
  font-size: 18px;
  font-weight: bold;
}
.row {
  margin-bottom: 12px;
}
</style>