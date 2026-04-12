import.meta.env.VITE_API_BASE_URL

export function getTaskResult(taskId) {
  return request({
    url: `/api/result/${taskId}`,
    method: 'get'
  })
}