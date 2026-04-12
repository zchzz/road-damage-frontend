import { computed, ref } from 'vue'

export function useTaskStream(taskId) {
  const previewAvailable = ref(true)

  const apiBase = computed(() => {
    return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  })

  const streamUrl = computed(() => {
    return `${apiBase.value}/api/stream/${taskId.value}`
  })

  function handleStreamError() {
    previewAvailable.value = false
  }

  function resetStreamState() {
    previewAvailable.value = true
  }

  return {
    previewAvailable,
    streamUrl,
    handleStreamError,
    resetStreamState
  }
}