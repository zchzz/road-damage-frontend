<template>
  <div class="main-layout">
    <AppHeader />

    <main class="main-layout__content">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.08), transparent 28%),
    radial-gradient(circle at top right, rgba(103, 194, 58, 0.08), transparent 24%),
    linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%);
}

.main-layout__content {
  flex: 1;
}
</style>