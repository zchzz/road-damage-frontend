<template>
  <div class="error-page">
    <h2>页面不存在</h2>
    <p>你访问的页面不存在，或该功能页面已被移除。</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.error-page {
  max-width: 720px;
  margin: 80px auto;
  padding: 24px;
  text-align: center;
}

.error-page h2 {
  margin-bottom: 12px;
}

.error-page p {
  margin-bottom: 16px;
  color: #666;
}
</style>