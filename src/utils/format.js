export function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '0%'
  }
  return `${Number(value).toFixed(0)}%`
}

export function formatStatusText(status) {
  const map = {
    idle: '未开始',
    queued: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}