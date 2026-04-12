<template>
  <div class="page-container" :class="{ 'is-narrow': narrow }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  narrow: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.page-container.is-narrow {
  max-width: 960px;
}

@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
}
</style>