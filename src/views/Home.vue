<template>
  <div class="home-page">
    <section class="hero">
      <h1>道路病害视频智能分析平台</h1>
      <p>
        上传道路巡检视频，系统自动完成病害检测、任务跟踪、结果展示与文件导出。
      </p>

      <div class="actions">
        <router-link to="/detect" class="btn btn-primary">
          开始视频分析
        </router-link>
      </div>
    </section>

    <section class="features">
      <div class="card">
        <h3>视频上传分析</h3>
        <p>支持 mp4、avi、mov、mkv 等常见视频格式。</p>
      </div>

      <div class="card">
        <h3>任务进度跟踪</h3>
        <p>支持轮询与 WebSocket 状态推送，随时查看当前进度。</p>
      </div>

      <div class="card">
        <h3>结果可视化</h3>
        <p>输出标注视频、检测明细、统计摘要与结果文件。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
}
.hero {
  text-align: center;
  padding: 64px 0 40px;
}
.hero h1 {
  font-size: 36px;
  margin-bottom: 16px;
}
.hero p {
  color: #666;
  margin-bottom: 24px;
}
.actions {
  display: flex;
  justify-content: center;
}
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
}
.btn-primary {
  background: #1677ff;
  color: #fff;
}
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
}
.card {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
}
</style>