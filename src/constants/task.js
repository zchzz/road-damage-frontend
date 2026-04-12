export const TASK_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const TASK_STATUS_LABEL = {
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
}

export const TASK_STATUS_TYPE = {
  processing: 'primary',
  completed: 'success',
  failed: 'danger'
}

export const TASK_TERMINAL_STATUS = ['completed', 'failed']
export const TASK_POLLING_INTERVAL = 3000