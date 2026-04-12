<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <div>
        <p class="app-footer__title">{{ title }}</p>
        <p class="app-footer__desc">{{ description }}</p>
      </div>

      <div class="app-footer__meta">
        <span>{{ year }}</span>
        <span class="dot">•</span>
        <span>{{ organization }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '道路病害智能检测系统'
  },
  description: {
    type: String,
    default: '基于深度学习的视频道路病害检测与分析平台'
  },
  organization: {
    type: String,
    default: 'Graduation Project'
  },
  year: {
    type: [String, Number],
    default: () => new Date().getFullYear()
  }
})
</script>

<style scoped>
.app-footer {
  background: #0f172a;
  color: rgba(255, 255, 255, 0.72);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.app-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-footer__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.app-footer__desc {
  margin: 6px 0 0;
  font-size: 12px;
}

.app-footer__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  white-space: nowrap;
}

.dot {
  opacity: 0.5;
}

@media (max-width: 768px) {
  .app-footer__inner {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>