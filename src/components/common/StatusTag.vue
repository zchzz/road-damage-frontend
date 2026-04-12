<template>
  <el-tag :type="tagType" effect="light" round>
    {{ label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'idle'
  }
})

const statusMap = {
  idle: { label: '未开始', type: 'info' },
  queued: { label: '排队中', type: 'info' },
  pending: { label: '等待中', type: 'info' },
  processing: { label: '处理中', type: 'warning' },
  running: { label: '运行中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'danger' },
  error: { label: '异常', type: 'danger' }
}

const current = computed(() => {
  return statusMap[props.status] || {
    label: props.status || '未知状态',
    type: 'info'
  }
})

const label = computed(() => current.value.label)
const tagType = computed(() => current.value.type)
</script>