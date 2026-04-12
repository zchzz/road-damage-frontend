import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { uploadVideo } from '@/api/upload'
import { useTaskStore } from '@/stores/task'

export function useUploadTask() {
  const router = useRouter()
  const taskStore = useTaskStore()

  const submitting = ref(false)

  async function createTask({
    file,
    mode,
    confidence,
    skipFrames,
    successMessage
  }) {
    if (!file) {
      throw new Error('请先选择视频文件')
    }

    try {
      submitting.value = true

      const res = await uploadVideo({
        file,
        mode,
        confidence,
        skipFrames
      })

      if (!res?.task_id) {
        throw new Error('任务创建成功，但未返回 task_id')
      }

      taskStore.resetTask()
      taskStore.setTask({
        taskId: res.task_id,
        mode,
        status: res.status || 'queued'
      })
      taskStore.setTaskParams({
        mode,
        confidence,
        skipFrames
      })

      ElMessage.success(successMessage || '任务创建成功')
      router.push(`/task/${res.task_id}`)

      return res
    } catch (error) {
      const message = error?.message || '创建任务失败'
      ElMessage.error(message)
      throw error
    } finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    createTask
  }
}