<template>
  <MainLayout>
    <PageContainer>
      <div class="theme-page">
        <section class="theme-hero">
          <div class="theme-hero__main">
            <div class="theme-badge">Road Damage Detection</div>
            <h1 class="theme-title">道路病害检测工作台</h1>
            <p class="theme-desc">
              统一上传、分析、任务跟踪与结果回看流程。首页只保留最关键的入口，
              视觉语言和 detect 页保持同一套蓝白渐变与玻璃卡片风格。
            </p>

            <div class="theme-chip-row">
              <span class="theme-chip">任务状态实时跟踪</span>
              <span class="theme-chip">结果报告统一查看</span>
            </div>

            <div class="theme-hero__actions">
              <el-button type="primary" size="large" @click="goDetect">
                进入视频分析
              </el-button>
            </div>
          </div>

          <div class="theme-hero__side">
            <div class="theme-panel__head">快速概览</div>
            <p class="theme-panel__sub">
              用更轻的首页承接后续三个核心页面：Detect、Task、Result。
            </p>

            <div class="theme-grid-two" style="margin-bottom: 0;">
              <div class="theme-metric-card">
                <span class="theme-metric-card__label">任务流程</span>
                <strong class="theme-metric-card__value">4</strong>
              </div>
              <div class="theme-metric-card">
                <span class="theme-metric-card__label">结果产物</span>
                <strong class="theme-metric-card__value">3</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="theme-grid-two">
          <div class="theme-panel">
            <div class="theme-panel__head">核心能力</div>
            <p class="theme-panel__sub">主页信息更聚焦，但保留完整的能力说明。</p>

            <div class="theme-list">
              <div class="theme-list-item">
                <span class="theme-list-item__title">任务追踪</span>
                <span class="theme-list-item__value">
                  支持进度、连接状态、统计信息和当前检测明细查看。
                </span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">结果交付</span>
                <span class="theme-list-item__value">
                  统一承接标注视频、JSON 和 HTML 报告。
                </span>
              </div>
            </div>
          </div>

          <div class="theme-panel">
            <div class="theme-panel__head">标准流程</div>
            <p class="theme-panel__sub">整体使用路径和 detect 页的操作节奏保持一致。</p>

            <div class="theme-list">
              <div class="theme-list-item">
                <span class="theme-list-item__title">01 提交任务</span>
                <span class="theme-list-item__value">上传视频并设置检测参数。</span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">02 跟踪进度</span>
                <span class="theme-list-item__value">查看任务状态、进度、连接方式与预览。</span>
              </div>
              <div class="theme-list-item">
                <span class="theme-list-item__title">03 查看结果</span>
                <span class="theme-list-item__value">浏览统计、检测明细和最终输出文件。</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goDetect() {
  router.push('/detect')
}
</script>