import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

import { createTaskWebSocket } from '@/api/websocket'
import { useTaskStore } from '@/stores/task'

export function useTaskWebSocket(taskId, options = {}) {
  const taskStore = useTaskStore()
  const wsRef = ref(null)

  const onCompleted = options.onCompleted
  const onFailed = options.onFailed
  const onProgress = options.onProgress
  const onOpen = options.onOpen
  const onClose = options.onClose
  const onError = options.onError

  function applyTaskPayload(payload = {}) {
    taskStore.updateProgress(payload)
  }

  function closeWebSocket() {
    if (wsRef.value) {
      wsRef.value.close()
      wsRef.value = null
    }
    taskStore.setWsConnected(false)
  }

  function connectWebSocket() {
    closeWebSocket()

    wsRef.value = createTaskWebSocket(taskId.value, {
      onOpen: () => {
        taskStore.setWsConnected(true)
        onOpen?.()
      },

      onMessage: async (data) => {
        if (!data) return

        if (data.type === 'progress') {
          applyTaskPayload({
            status: 'processing',
            ...data
          })
          onProgress?.(data)
          return
        }

        if (data.type === 'completed') {
          applyTaskPayload({
            status: 'completed',
            progress: 100,
            ...data
          })
          await onCompleted?.(data)
          return
        }

        if (data.type === 'failed') {
          applyTaskPayload({
            status: 'failed',
            ...data
          })
          taskStore.setError(data?.message || '任务执行失败')
          ElMessage.error(data?.message || '任务执行失败')
          await onFailed?.(data)
        }
      },

      onError: (error) => {
        console.error('WebSocket error:', error)
        taskStore.setWsConnected(false)
        onError?.(error)
      },

      onClose: () => {
        taskStore.setWsConnected(false)
        onClose?.()
      }
    })

    return wsRef.value
  }

  onBeforeUnmount(() => {
    closeWebSocket()
  })

  return {
    wsRef,
    connectWebSocket,
    closeWebSocket
  }
}