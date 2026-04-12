<template>
  <div class="error-state">
    <el-result
      icon="error"
      :title="title"
      :sub-title="description"
    >
      <template #extra>
        <div class="error-state__actions">
          <el-button @click="$emit('back')">返回</el-button>
          <el-button type="primary" @click="$emit('retry')">重试</el-button>
        </div>
      </template>
    </el-result>
  </div>
</template>

<script setup>
defineEmits(['retry', 'back'])

defineProps({
  title: {
    type: String,
    default: '加载失败'
  },
  description: {
    type: String,
    default: '请求处理过程中出现问题，请稍后重试'
  }
})
</script>

<style scoped>
.error-state {
  padding: 24px 0;
}

.error-state__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>