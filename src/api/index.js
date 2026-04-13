import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

export function uploadVideo(formData, options = {}) {
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: options.timeout ?? 10 * 60 * 1000,
    onUploadProgress: options.onUploadProgress
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

export function getBackendOrigin() {
  const raw = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  return raw.replace(/\/$/, '').replace(/\/api$/, '')
}

export function resolveBackendFileUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = getBackendOrigin()
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export default api