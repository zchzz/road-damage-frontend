import { getApiBaseUrl } from '@/api/client'

function getWsBaseUrl() {
  const envWsBase = import.meta.env.VITE_WS_BASE_URL
  if (envWsBase) return envWsBase

  const apiBase = getApiBaseUrl()

  if (apiBase.startsWith('https://')) {
    return apiBase.replace(/^https:\/\//, 'wss://')
  }

  if (apiBase.startsWith('http://')) {
    return apiBase.replace(/^http:\/\//, 'ws://')
  }

  return apiBase
}

export function createTaskWebSocket(taskId, handlers = {}) {
  const wsBaseUrl = getWsBaseUrl()
  const ws = new WebSocket(`${wsBaseUrl}/ws/${taskId}`)

  ws.onopen = () => {
    handlers.onOpen?.()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handlers.onMessage?.(data)
    } catch (error) {
      handlers.onError?.(error)
    }
  }

  ws.onerror = (error) => {
    handlers.onError?.(error)
  }

  ws.onclose = () => {
    handlers.onClose?.()
  }

  return ws
}

export function getTaskWebSocketUrl(taskId) {
  return `${getWsBaseUrl()}/ws/${taskId}`
}