<template>
  <div class="task-page">
    <div class="header">
      <h2>任务详情</h2>
      <p>任务 ID：{{ taskId }}</p>
    </div>

    <div class="panel" v-if="task">
      <div class="row">
        <span class="label">状态</span>
        <span class="value">{{ task.status }}</span>
      </div>

      <div class="row">
        <span class="label">说明</span>
        <span class="value">{{ task.message || '-' }}</span>
      </div>

      <div class="row">
        <span class="label">进度</span>
        <span class="value">{{ task.progress || 0 }}%</span>
      </div>

      <div class="progress-bar">
        <div class="progress-inner" :style="{ width: `${task.progress || 0}%` }"></div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-title">当前帧</div>
          <div class="stat-value">{{ task.current_frame ?? '-' }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">总帧数</div>
          <div class="stat-value">{{ task.total_frames ?? '-' }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">结果是否生成</div>
          <div class="stat-value">{{ task.result_ready ? '是' : '否' }}</div>
        </div>
      </div>

      <div v-if="task.status === 'completed'" class="actions">
        <button @click="goResult">查看结果</button>
      </div>

      <div v-if="task.status === 'failed'" class="error">
        任务处理失败，请返回重新提交。
      </div>
    </div>

    <div v-else class="panel">
      正在加载任务信息...
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask, getTaskWsUrl } from '@/api'

const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId

const task = ref(null)
const ws = ref(null)
let timer = null

async function fetchTask() {
  try {
    const { data } = await getTask(taskId)
    task.value = data

    if (data.status === 'completed') {
      stopPolling()
    }
  } catch (error) {
    console.error('获取任务失败:', error)
  }
}

function startPolling() {
  stopPolling()
  timer = setInterval(fetchTask, 3000)
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function connectWs() {
  try {
    ws.value = new WebSocket(getTaskWsUrl(taskId))

    ws.value.onopen = () => {
      console.log('WebSocket 已连接')
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        task.value = {
          ...task.value,
          ...data
        }

        if (data.status === 'completed') {
          stopPolling()
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket 错误:', error)
    }

    ws.value.onclose = () => {
      console.log('WebSocket 已关闭，继续使用轮询')
    }
  } catch (error) {
    console.error('创建 WebSocket 失败:', error)
  }
}

function closeWs() {
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
}

function goResult() {
  router.push(`/result/${taskId}`)
}

onMounted(async () => {
  await fetchTask()
  connectWs()
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
  closeWs()
})
</script>

<style scoped>
.task-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}
.header {
  margin-bottom: 24px;
}
.panel {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 24px;
}
.row {
  display: flex;
  margin-bottom: 14px;
}
.label {
  width: 100px;
  color: #666;
}
.value {
  flex: 1;
}
.progress-bar {
  width: 100%;
  height: 12px;
  background: #f1f3f5;
  border-radius: 999px;
  overflow: hidden;
  margin: 16px 0 24px;
}
.progress-inner {
  height: 100%;
  background: #1677ff;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-item {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px;
}
.stat-title {
  color: #666;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
}
.actions {
  margin-top: 24px;
}
.actions button {
  padding: 10px 18px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 8px;
}
.error {
  margin-top: 20px;
  color: #d93025;
}
</style>