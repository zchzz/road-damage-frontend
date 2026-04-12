import request from '../utils/request'

export function getTaskResult(taskId) {
  return request({
    url: `/api/result/${taskId}`,
    method: 'get'
  })
}