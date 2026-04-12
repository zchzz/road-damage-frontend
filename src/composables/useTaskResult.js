import { ref } from 'vue'

import { getTaskResult } from '@/api/result'
import { useTaskStore } from '@/stores/task'

export function useTaskResult(taskId) {
  const taskStore = useTaskStore()

  const loading = ref(false)
  const errorMessage = ref('')

  async function fetchResult(force = false) {
    if (!force && taskStore.result && taskStore.currentTaskId === taskId.value) {
      return taskStore.result
    }

    try {
      loading.value = true
      errorMessage.value = ''

      if (taskStore.currentTaskId !== taskId.value) {
        taskStore.resetTask()
        taskStore.setTask({
          taskId: taskId.value,
          status: 'completed'
        })
      }

      const res = await getTaskResult(taskId.value)
      taskStore.setResult(res)
      taskStore.clearError()

      return res
    } catch (error) {
      const message = error?.message || '获取结果失败'
      errorMessage.value = message
      taskStore.setError(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    errorMessage,
    fetchResult
  }
}