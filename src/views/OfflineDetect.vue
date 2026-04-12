<template>
  <div class="page">
    <div class="container">
      <h2>离线解析</h2>

      <ProgressPanel
        :status="status"
        :message="message"
        :progress="progress"
        :current-frame="0"
        :total-frames="0"
      />

      <div class="tips">
        <el-alert
          title="离线解析模式下，系统会在后端处理完成后统一返回结果。"
          type="info"
          :closable="false"
        />
      </div>

      <div class="actions">
        <el-button @click="goHome">返回首页</el-button>
        <el-button
          type="success"
          :disabled="status !== 'completed'"
          @click="goResult"
        >
          查看结果
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskStatus } from '../api/task'
import ProgressPanel from '../components/ProgressPanel.vue'

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const router = useRouter()

const status = ref('queued')
const progress = ref(0)
const message = ref('等待处理')

let timer = null

function goHome() {
  router.push('/')
}

function goResult() {
  router.push(`/result/${props.taskId}`)
}

async function pollTaskStatus() {
  try {
    const res = await getTaskStatus(props.taskId)
    status.value = res.status
    progress.value = res.progress || 0
    message.value = res.message || '处理中'

    if (res.status === 'completed') {
      ElMessage.success('离线解析完成')
      clearInterval(timer)
      timer = null
    }

    if (res.status === 'failed') {
      ElMessage.error(res.message || '任务失败')
      clearInterval(timer)
      timer = null
    }
  } catch (error) {
    ElMessage.error(error.message || '查询任务状态失败')
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  pollTaskStatus()
  timer = setInterval(pollTaskStatus, 3000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
}
.container {
  max-width: 960px;
  margin: 0 auto;
}
.tips {
  margin-top: 20px;
}
.actions {
  margin-top: 20px;
}
</style>