<template>
  <MainLayout>
    <div class="home-page">
      <PageContainer>
        <section class="hero-section">
          <div class="hero-section__content">
            <div class="hero-section__badge">
              Intelligent Road Inspection Platform
            </div>

            <h1 class="hero-section__title">
              道路病害智能检测系统
            </h1>

            <p class="hero-section__subtitle">
              基于深度学习的视频道路病害识别与分析平台，支持在线实时检测、
              离线批量分析、结果可视化展示与统计报告输出。
            </p>

            <div class="hero-section__actions">
              <el-button type="primary" size="large" @click="goOnline">
                在线分析
              </el-button>
              <el-button size="large" @click="goOffline">
                离线分析
              </el-button>
            </div>

            <div class="hero-section__metrics">
              <div class="metric-card">
                <div class="metric-card__value">YOLOv8</div>
                <div class="metric-card__label">检测模型</div>
              </div>
              <div class="metric-card">
                <div class="metric-card__value">WebSocket</div>
                <div class="metric-card__label">实时状态推送</div>
              </div>
              <div class="metric-card">
                <div class="metric-card__value">JSON / HTML</div>
                <div class="metric-card__label">报告输出</div>
              </div>
            </div>
          </div>

          <div class="hero-section__panel">
            <div class="preview-card">
              <div class="preview-card__header">
                <span class="preview-card__dot is-blue"></span>
                <span class="preview-card__dot is-green"></span>
                <span class="preview-card__dot is-orange"></span>
                <span class="preview-card__title">系统能力预览</span>
              </div>

              <div class="preview-card__body">
                <div class="preview-block">
                  <div class="preview-block__label">任务状态</div>
                  <div class="preview-block__row">
                    <el-tag type="warning" round>处理中</el-tag>
                    <span class="preview-block__text">当前帧 248 / 960</span>
                  </div>
                  <el-progress :percentage="68" />
                </div>

                <div class="preview-block">
                  <div class="preview-block__label">识别统计</div>
                  <div class="damage-list">
                    <div class="damage-item">
                      <span>纵向裂缝</span>
                      <strong>18</strong>
                    </div>
                    <div class="damage-item">
                      <span>横向裂缝</span>
                      <strong>9</strong>
                    </div>
                    <div class="damage-item">
                      <span>坑洞</span>
                      <strong>4</strong>
                    </div>
                  </div>
                </div>

                <div class="preview-block">
                  <div class="preview-block__label">结果产物</div>
                  <div class="file-tags">
                    <el-tag effect="plain">标注视频</el-tag>
                    <el-tag effect="plain">结果 JSON</el-tag>
                    <el-tag effect="plain">HTML 报告</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-gap">
          <div class="section-head">
            <h2 class="section-head__title">核心能力</h2>
            <p class="section-head__desc">
              以检测任务为核心，打通上传、处理、结果展示与报告导出全流程。
            </p>
          </div>

          <div class="feature-grid">
            <SectionCard
              title="在线实时分析"
              description="适用于展示型场景，支持实时状态反馈与检测过程可视化。"
            >
              <ul class="feature-list">
                <li>任务创建后快速进入处理页面</li>
                <li>WebSocket 推送实时进度与检测信息</li>
                <li>适合演示与答辩场景</li>
              </ul>
            </SectionCard>

            <SectionCard
              title="离线批量分析"
              description="适用于长视频或较大文件处理，强调稳定性与结果回看。"
            >
              <ul class="feature-list">
                <li>支持后台处理与轮询状态跟踪</li>
                <li>适合较长视频和正式结果产出</li>
                <li>处理完成后统一查看结果</li>
              </ul>
            </SectionCard>

            <SectionCard
              title="统计与报告输出"
              description="自动整理病害类别信息，形成结果摘要与报告。"
            >
              <ul class="feature-list">
                <li>输出标注视频、JSON 与 HTML 报告</li>
                <li>支持病害类型分布统计</li>
                <li>便于项目展示与结果留存</li>
              </ul>
            </SectionCard>
          </div>
        </section>

        <section class="section-gap">
          <div class="section-head">
            <h2 class="section-head__title">使用流程</h2>
            <p class="section-head__desc">
              让老师和评审一眼看懂系统从输入到输出的完整闭环。
            </p>
          </div>

          <div class="flow-grid">
            <div class="flow-card">
              <div class="flow-card__index">01</div>
              <h3>选择模式</h3>
              <p>根据场景进入在线分析或离线分析工作台。</p>
            </div>
            <div class="flow-card">
              <div class="flow-card__index">02</div>
              <h3>上传视频</h3>
              <p>设置置信度、跳帧等参数后提交检测任务。</p>
            </div>
            <div class="flow-card">
              <div class="flow-card__index">03</div>
              <h3>追踪任务</h3>
              <p>查看处理进度、实时状态与检测统计信息。</p>
            </div>
            <div class="flow-card">
              <div class="flow-card__index">04</div>
              <h3>查看结果</h3>
              <p>浏览标注视频、统计图表和分析报告文件。</p>
            </div>
          </div>
        </section>

        <section class="section-gap">
          <SectionCard
            title="立即开始"
            description="进入对应工作台，开始构建新的道路病害检测任务。"
          >
            <div class="cta-row">
              <div class="cta-card">
                <h3>在线分析</h3>
                <p>适合实时演示、过程展示和状态反馈场景。</p>
                <el-button type="primary" @click="goOnline">
                  进入在线分析
                </el-button>
              </div>

              <div class="cta-card">
                <h3>离线分析</h3>
                <p>适合长视频处理、稳定产出与结果回看场景。</p>
                <el-button @click="goOffline">
                  进入离线分析
                </el-button>
              </div>
            </div>
          </SectionCard>
        </section>
      </PageContainer>
    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionCard from '@/components/common/SectionCard.vue'

const router = useRouter()

function goOnline() {
  router.push('/detect/online')
}

function goOffline() {
  router.push('/detect/offline')
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

.hero-section {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 24px;
  align-items: center;
  padding: 36px 0 20px;
}

.hero-section__content {
  min-width: 0;
}

.hero-section__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.1);
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.hero-section__title {
  margin: 18px 0 12px;
  font-size: 44px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.hero-section__subtitle {
  max-width: 720px;
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
  color: #475569;
}

.hero-section__actions {
  margin-top: 28px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.hero-section__metrics {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 18px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.metric-card__value {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.metric-card__label {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.hero-section__panel {
  min-width: 0;
}

.preview-card {
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  color: #fff;
}

.preview-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-card__dot.is-blue {
  background: #409eff;
}

.preview-card__dot.is-green {
  background: #67c23a;
}

.preview-card__dot.is-orange {
  background: #e6a23c;
}

.preview-card__title {
  margin-left: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

.preview-card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.preview-block {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
}

.preview-block__label {
  margin-bottom: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.preview-block__row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-block__text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.damage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.damage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.damage-item span {
  color: rgba(255, 255, 255, 0.78);
}

.damage-item strong {
  font-size: 16px;
  color: #ffffff;
}

.file-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-gap {
  margin-top: 40px;
}

.section-head {
  margin-bottom: 18px;
}

.section-head__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.section-head__desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.feature-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.9;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.flow-card {
  padding: 22px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.flow-card__index {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  margin-bottom: 14px;
}

.flow-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #0f172a;
}

.flow-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #64748b;
}

.cta-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.cta-card {
  padding: 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e5e7eb;
}

.cta-card h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #0f172a;
}

.cta-card p {
  margin: 0 0 18px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .hero-section {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .flow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding-top: 20px;
  }

  .hero-section__title {
    font-size: 32px;
  }

  .hero-section__subtitle {
    font-size: 14px;
  }

  .hero-section__metrics {
    grid-template-columns: 1fr;
  }

  .flow-grid,
  .cta-row {
    grid-template-columns: 1fr;
  }

  .section-head__title {
    font-size: 24px;
  }
}
</style>