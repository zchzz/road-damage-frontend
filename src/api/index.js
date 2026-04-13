import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

export function uploadVideo(formData) {
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getTask(taskId) {
  return api.get(`/task/${taskId}`)
}

export function getResult(taskId) {
  return api.get(`/result/${taskId}`)
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