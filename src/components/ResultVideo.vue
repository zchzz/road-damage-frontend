<template>
  <el-card shadow="hover">
    <template #header>
      <div class="title">结果视频</div>
    </template>

    <video
      v-if="src"
      :src="src"
      controls
      style="width: 100%; border-radius: 8px;"
    />
    <el-empty v-else description="暂无结果视频" />
  </el-card>
</template>

<script setup>
defineProps({
  src: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.title {
  font-size: 18px;
  font-weight: bold;
}
</style>