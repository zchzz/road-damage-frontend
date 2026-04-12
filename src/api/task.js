import request from '@/api/client'

export function getTaskStatus(taskId) {
  return request({
    url: `/api/task/${taskId}`,
    method: 'get'
  })
}