import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', {
  state: () => ({
    currentTaskId: '',
    mode: '',
    status: 'idle',
    progress: 0,
    message: '',
    summary: {},
    detections: [],
    currentFrame: 0,
    totalFrames: 0,
    result: null
  }),
  actions: {
    setTask(payload) {
      this.currentTaskId = payload.taskId || ''
      this.mode = payload.mode || ''
      this.status = payload.status || 'queued'
    },
    updateProgress(payload) {
      this.status = payload.status ?? this.status
      this.progress = payload.progress ?? this.progress
      this.message = payload.message ?? this.message
      this.currentFrame = payload.current_frame ?? this.currentFrame
      this.totalFrames = payload.total_frames ?? this.totalFrames
      this.detections = payload.detections ?? this.detections
      this.summary = payload.statistics ?? this.summary
    },
    setResult(result) {
      this.result = result
      this.status = 'completed'
    },
    resetTask() {
      this.currentTaskId = ''
      this.mode = ''
      this.status = 'idle'
      this.progress = 0
      this.message = ''
      this.summary = {}
      this.detections = []
      this.currentFrame = 0
      this.totalFrames = 0
      this.result = null
    }
  }
})