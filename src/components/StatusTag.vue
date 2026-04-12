<template>
  <el-tag :type="tagType">{{ text }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { formatStatusText } from '../utils/format'

const props = defineProps({
  status: {
    type: String,
    default: 'idle'
  }
})

const tagType = computed(() => {
  if (props.status === 'completed') return 'success'
  if (props.status === 'failed') return 'danger'
  if (props.status === 'processing') return 'warning'
  if (props.status === 'queued') return 'info'
  return ''
})

const text = computed(() => formatStatusText(props.status))
</script>