<template>
  <MainLayout>
    <PageContainer narrow>
      <div class="error-page">
        <SectionCard
          title="页面异常"
          description="当前访问的页面不存在，或请求过程中发生了错误。"
        >
          <ErrorState
            title="页面未找到或加载失败"
            :description="description"
            @retry="goHome"
            @back="goHome"
          />
        </SectionCard>

        <div class="error-page__actions">
          <el-button @click="goBack">返回上一页</el-button>
          <el-button type="primary" @click="goHome">返回首页</el-button>
        </div>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()
const route = useRoute()

const description = computed(() => {
  if (route.query?.message) {
    return String(route.query.message)
  }
  return '请检查访问路径是否正确，或稍后重试。'
})

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.error-page {
  padding: 40px 0;
}

.error-page__actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .error-page {
    padding: 24px 0;
  }

  .error-page__actions {
    flex-direction: column;
  }

  .error-page__actions .el-button {
    width: 100%;
  }
}
</style>