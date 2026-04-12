import.meta.env.VITE_WS_BASE_URL
export function createTaskWebSocket(taskId, handlers = {}) {
  const wsBase = import.meta.env.VITE_WS_BASE_URL
  const ws = new WebSocket(`${wsBase}/ws/${taskId}`)

  ws.onopen = () => {
    handlers.onOpen && handlers.onOpen()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handlers.onMessage && handlers.onMessage(data)
    } catch (error) {
      handlers.onError && handlers.onError(error)
    }
  }

  ws.onerror = (error) => {
    handlers.onError && handlers.onError(error)
  }

  ws.onclose = () => {
    handlers.onClose && handlers.onClose()
  }

  return ws
}