import request from '../utils/request'

export function getTaskStatus(taskId) {
  return request({
    url: `/api/task/${taskId}`,
    method: 'get'
  })
}