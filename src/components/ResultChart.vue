<template>
  <el-card shadow="hover">
    <template #header>
      <div class="title">病害统计图</div>
    </template>
    <div ref="chartRef" style="height: 360px;"></div>
  </el-card>
</template>

<script setup>
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({})
  }
})

const chartRef = ref(null)
let chartInstance = null

function renderChart() {
  if (!chartRef.value) return

  const entries = Object.entries(props.summary || {})
  const names = entries.map(([key]) => key)
  const values = entries.map(([, value]) => value)

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  chartInstance.setOption({
    tooltip: {},
    xAxis: {
      type: 'category',
      data: names
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        data: values
      }
    ]
  })
}

onMounted(async () => {
  await nextTick()
  renderChart()
})

watch(
  () => props.summary,
  async () => {
    await nextTick()
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.title {
  font-size: 18px;
  font-weight: bold;
}
</style>