import request, { getApiBaseUrl } from '@/api/client'

function normalizeUrl(value) {
  if (!value) return ''
  if (String(value).startsWith('http')) return value
  return `${getApiBaseUrl()}${value}`
}

export function getTaskResult(taskId) {
  return request({
    url: `/api/result/${taskId}`,
    method: 'get'
  }).then((res) => {
    if (!res) return null

    return {
      ...res,
      annotated_video_url: normalizeUrl(res.annotated_video_url),
      json_url: normalizeUrl(res.json_url),
      report_url: normalizeUrl(res.report_url)
    }
  })
}