import request from '../utils/request'

export function uploadVideo({ file, mode, confidence, skipFrames }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('mode', mode)
  formData.append('confidence', confidence)
  formData.append('skip_frames', skipFrames)

  return request({
    url: '/api/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}