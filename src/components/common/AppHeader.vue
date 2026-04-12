<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__left" @click="goHome">
        <div class="app-header__logo">RD</div>
        <div class="app-header__brand">
          <h1 class="app-header__title">{{ title }}</h1>
          <p v-if="subtitle" class="app-header__subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <nav class="app-header__nav">
        <el-button text @click="goHome">首页</el-button>
        <el-button text @click="goOnline">在线分析</el-button>
        <el-button text @click="goOffline">离线分析</el-button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: '道路病害智能检测系统'
  },
  subtitle: {
    type: String,
    default: 'Road Damage Detection Platform'
  }
})

const router = useRouter()

function goHome() {
  router.push('/')
}

function goOnline() {
  router.push('/detect/online')
}

function goOffline() {
  router.push('/detect/offline')
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(10, 18, 32, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-header__inner {
  max-width: 1280px;
  height: 72px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  min-width: 0;
}

.app-header__logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 1px;
}

.app-header__brand {
  min-width: 0;
}

.app-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.app-header__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.app-header__nav .el-button) {
  color: rgba(255, 255, 255, 0.88);
}

:deep(.app-header__nav .el-button:hover) {
  color: #ffffff;
}

@media (max-width: 768px) {
  .app-header__inner {
    padding: 0 16px;
    height: 64px;
  }

  .app-header__subtitle {
    display: none;
  }

  .app-header__nav {
    gap: 2px;
  }
}
</style>