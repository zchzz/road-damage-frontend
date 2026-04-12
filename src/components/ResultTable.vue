<template>
  <el-card shadow="hover">
    <template #header>
      <div class="title">当前检测结果</div>
    </template>

    <el-table :data="rows" stripe border>
      <el-table-column prop="class_name" label="病害类型" />
      <el-table-column prop="confidence" label="置信度">
        <template #default="{ row }">
          {{ Number(row.confidence).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="bbox" label="边界框">
        <template #default="{ row }">
          {{ row.bbox?.join(', ') }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.title {
  font-size: 18px;
  font-weight: bold;
}
</style>