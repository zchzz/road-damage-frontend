import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 30000
})

export function uploadVideo(formData) {
  return api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getTask(taskId) {
  return api.get(`/api/task/${taskId}`)
}

export function getResult(taskId) {
  return api.get(`/api/result/${taskId}`)
}

export function getTaskWsUrl(taskId) {
  const explicit = import.meta.env.VITE_WS_BASE_URL
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/ws/${taskId}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/${taskId}`
}

export default api