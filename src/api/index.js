import axios from 'axios'

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
}

function toAbsoluteUrl(url) {
  if (!url) return ''
  const str = String(url)
  if (str.startsWith('http://') || str.startsWith('https://')) return str
  return `${getApiBaseUrl()}${str.startsWith('/') ? '' : '/'}${str}`
}

function normalizeTaskPayload(data) {
  if (!data || typeof data !== 'object') return data

  return {
    ...data,
    output_video_url: toAbsoluteUrl(data.output_video_url),
    result_json_url: toAbsoluteUrl(data.result_json_url),
    report_url: toAbsoluteUrl(data.report_url)
  }
}

function normalizeResultPayload(data) {
  if (!data || typeof data !== 'object') return data

  const summary =
    data.summary && typeof data.summary === 'object'
      ? data.summary
      : {}

  const detections = Array.isArray(data.detections)
    ? data.detections
    : []

  return {
    ...data,
    output_video_url: toAbsoluteUrl(
      data.output_video_url || data.annotated_video_url || data.video_url
    ),
    result_json_url: toAbsoluteUrl(
      data.result_json_url || data.json_url
    ),
    report_url: toAbsoluteUrl(data.report_url),
    summary,
    detections,
    raw_result: data.raw_result || {}
  }
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000
})

export function uploadVideo(formData) {
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getTask(taskId) {
  return api.get(`/api/task/${taskId}`).then((res) => ({
    ...res,
    data: normalizeTaskPayload(res.data)
  }))
}

export function getResult(taskId) {
  return api.get(`/api/result/${taskId}`).then((res) => ({
    ...res,
    data: normalizeResultPayload(res.data)
  }))
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