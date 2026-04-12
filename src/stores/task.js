import { defineStore } from 'pinia'

function getInitialState() {
  return {
    currentTaskId: '',
    mode: '',
    status: 'idle',
    progress: 0,
    message: '',
    currentFrame: 0,
    totalFrames: 0,
    detections: [],
    summary: {},
    result: null,
    wsConnected: false,
    pollingActive: false,
    errorMessage: ''
  }
}

export const useTaskStore = defineStore('task', {
  state: () => getInitialState(),

  getters: {
    isCompleted: (state) =>
      ['completed', 'success'].includes(state.status),

    isFailed: (state) =>
      ['failed', 'error'].includes(state.status),

    isProcessing: (state) =>
      ['queued', 'pending', 'processing', 'running'].includes(state.status),

    normalizedProgress: (state) => {
      const value = Number(state.progress || 0)
      if (Number.isNaN(value)) return 0
      return Math.max(0, Math.min(100, value))
    },

    statList: (state) => {
      return Object.entries(state.summary || {}).map(([name, count]) => ({
        name,
        count
      }))
    }
  },

  actions: {
    setTask(payload = {}) {
      this.currentTaskId = payload.taskId || payload.currentTaskId || ''
      this.mode = payload.mode || this.mode || ''
      this.status = payload.status || 'queued'
      this.errorMessage = ''
    },

    setTaskParams(payload = {}) {
      this.mode = payload.mode ?? this.mode
    },

    updateProgress(payload = {}) {
      this.status = payload.status ?? this.status
      this.progress = payload.progress ?? this.progress
      this.message = payload.message ?? this.message
      this.currentFrame = payload.current_frame ?? this.currentFrame
      this.totalFrames = payload.total_frames ?? this.totalFrames
      this.detections = Array.isArray(payload.detections)
        ? payload.detections
        : this.detections

      this.summary =
        payload.statistics ??
        payload.summary ??
        this.summary
    },

    setSummary(summary = {}) {
      this.summary = summary
    },

    setDetections(detections = []) {
      this.detections = Array.isArray(detections) ? detections : []
    },

    setResult(result = null) {
      this.result = result
      if (result?.status) {
        this.status = result.status
      } else {
        this.status = 'completed'
      }

      if (result?.summary && Object.keys(this.summary || {}).length === 0) {
        this.summary = result.summary?.damage_types || result.summary || {}
      }
    },

    setWsConnected(connected) {
      this.wsConnected = Boolean(connected)
    },

    setPollingActive(active) {
      this.pollingActive = Boolean(active)
    },

    setError(message = '') {
      this.errorMessage = message
      if (message) {
        this.status = 'error'
      }
    },

    clearError() {
      this.errorMessage = ''
    },

    resetTask() {
      Object.assign(this, getInitialState())
    }
  }
})