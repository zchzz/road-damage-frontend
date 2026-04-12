<template>
  <el-card class="section-card" shadow="hover">
    <template v-if="title || $slots.header" #header>
      <div class="section-card__header">
        <div>
          <div v-if="title" class="section-card__title">{{ title }}</div>
          <div v-if="description" class="section-card__description">{{ description }}</div>
        </div>

        <div v-if="$slots.extra" class="section-card__extra">
          <slot name="extra" />
        </div>
      </div>

      <slot v-if="$slots.header" name="header" />
    </template>

    <div class="section-card__body">
      <slot />
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.section-card {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-card__title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.section-card__description {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.section-card__extra {
  flex-shrink: 0;
}

.section-card__body {
  min-height: 40px;
}
</style>