import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

import { getTaskStatus } from '@/api/task'
import { useTaskStore } from '@/stores/task'

export function useTaskPolling(taskId, options = {}) {
  const taskStore = useTaskStore()

  const timer = ref(null)

  const interval = options.interval || 3000
  const onCompleted = options.onCompleted
  const onFailed = options.onFailed
  const onStatus = options.onStatus

  function applyTaskPayload(payload = {}) {
    taskStore.updateProgress(payload)
  }

  async function fetchOnce() {
    const res = await getTaskStatus(taskId.value)

    applyTaskPayload(res)
    onStatus?.(res)

    if (res?.status === 'failed' || res?.status === 'error') {
      taskStore.setError(res?.message || '任务执行失败')
    }

    return res
  }

  function isTerminalStatus(status) {
    return ['completed', 'success', 'failed', 'error'].includes(status)
  }

  function stopPolling() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    taskStore.setPollingActive(false)
  }

  function startPolling() {
    if (timer.value) return

    taskStore.setPollingActive(true)

    timer.value = setInterval(async () => {
      try {
        const res = await fetchOnce()

        if (res?.status === 'completed' || res?.status === 'success') {
          stopPolling()
          await onCompleted?.(res)
          return
        }

        if (res?.status === 'failed' || res?.status === 'error') {
          stopPolling()
          ElMessage.error(res?.message || '任务执行失败')
          await onFailed?.(res)
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }, interval)
  }

  async function startWithImmediateFetch() {
    const res = await fetchOnce()

    if (isTerminalStatus(res?.status)) {
      if (res?.status === 'completed' || res?.status === 'success') {
        await onCompleted?.(res)
      } else if (res?.status === 'failed' || res?.status === 'error') {
        await onFailed?.(res)
      }
      return res
    }

    startPolling()
    return res
  }

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    fetchOnce,
    startPolling,
    startWithImmediateFetch,
    stopPolling
  }
}