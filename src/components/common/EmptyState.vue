<template>
  <div class="empty-state">
    <el-empty :description="description">
      <template v-if="title" #description>
        <div class="empty-state__desc">
          <p class="empty-state__title">{{ title }}</p>
          <p class="empty-state__text">{{ description }}</p>
        </div>
      </template>

      <el-button v-if="buttonText" type="primary" @click="$emit('action')">
        {{ buttonText }}
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
defineEmits(['action'])

defineProps({
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '当前没有可展示的内容'
  },
  buttonText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.empty-state {
  padding: 24px 0;
}

.empty-state__desc {
  text-align: center;
}

.empty-state__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.empty-state__text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
</style>