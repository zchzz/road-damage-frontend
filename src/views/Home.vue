<template>
  <div class="app-wrapper">
    <header class="main-header">
      <div class="header-left">
        <div class="brand-logo">
          <el-icon :size="28"><Cpu /></el-icon>
        </div>
        <div class="brand-text">
          <h1>道路缺陷检测系统</h1>
          <p>Intelligent Video Behavior Detection System</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag type="success" effect="dark" round>系统运行正常</el-tag>
        <el-divider direction="vertical" />
        <span class="user-info">计算节点: GPU-Node-01</span>
      </div>
    </header>

    <main class="main-content">
      <aside class="config-sidebar">
        <div class="card-header-title">
          <el-icon><Operation /></el-icon> 算法参数配置
        </div>

        <el-form :model="form" label-position="top" class="custom-form">
          <el-form-item label="检测置信度阈值 (Confidence)">
            <template #label>
              <div class="label-with-tooltip">
                检测置信度 <el-tooltip content="过滤掉得分低于此值的检测结果"><el-icon><QuestionFilled /></el-icon></el-tooltip>
              </div>
            </template>
            <el-slider v-model="form.confidence" :min="0" :max="1" :step="0.01" />
            <div class="slider-value">{{ form.confidence.toFixed(2) }}</div>
          </el-form-item>

          <el-form-item label="抽帧采样频率 (Frame Skip)">
            <el-input-number v-model="form.skipFrames" :min="1" :max="30" class="full-width" />
            <p class="input-tip">数值越大处理越快，但可能遗漏细节</p>
          </el-form-item>

          <el-form-item label="运算推理模式">
            <el-select v-model="form.mode" class="full-width">
              <el-option label="实时平衡模式 (FP16)" value="real" />
              <el-option label="高精度检测模式 (FP32)" value="precise" />
              <el-option label="极速预览模式 (INT8)" value="fast" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="workflow-info">
          <div class="workflow-title">处理流程</div>
          <el-steps direction="vertical" :active="submitting ? 1 : 0" size="small">
            <el-step title="视频流预处理" />
            <el-step title="特征向量提取" />
            <el-step title="行为逻辑判定" />
            <el-step title="结果渲染生成" />
          </el-steps>
        </div>
      </aside>

      <section class="task-area">
        <div class="glass-card upload-section">
          <div class="card-header-title">
            <el-icon><VideoCamera /></el-icon> 待分析数据源
          </div>

          <el-upload
            class="analysis-uploader"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            @change="handleFileChange"
          >
            <div v-if="!selectedFile" class="upload-placeholder">
              <el-icon class="el-icon--upload"><Cloudy /></el-icon>
              <div class="el-upload__text">
                将视频文件拖到此处，或 <em>点击上传本地资源</em>
              </div>
            </div>
            <div v-else class="file-preview-box">
              <div class="file-icon"><VideoPlay /></div>
              <div class="file-details">
                <span class="name">{{ selectedFile.name }}</span>
                <span class="size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              </div>
              <el-button type="danger" link @click.stop="selectedFile = null">重选</el-button>
            </div>
          </el-upload>
        </div>

        <div class="glass-card action-panel">
          <div class="status-monitor" v-if="submitting">
            <div class="monitor-header">
              <span class="loading-text">
                <el-icon class="is-loading"><Loading /></el-icon> 数据同步至云端推理服务器...
              </span>
              <span class="percentage">{{ uploadPercent }}%</span>
            </div>
            <el-progress
              :percentage="uploadPercent"
              :stroke-width="15"
              :color="linearGradient"
              striped
              striped-flow
            />
          </div>

          <div class="button-group">
            <el-button
              type="primary"
              size="large"
              class="glow-button"
              :loading="submitting"
              @click="submitTask"
            >
              {{ submitting ? '后端计算中...' : '启动 AI 行为检测' }}
            </el-button>
            <el-button size="large" plain @click="resetForm">重置参数</el-button>
          </div>
        </div>

        <div class="system-logs glass-card">
          <div class="log-header">系统实时日志 (Console)</div>
          <div class="log-content">
            <p v-for="(log, index) in logs" :key="index" :class="log.type">
              <span class="time">[{{ log.time }}]</span> {{ log.msg }}
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { Cpu, Operation, VideoCamera, Cloudy, VideoPlay, Loading, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// --- 状态定义 ---
const submitting = ref(false);
const uploadPercent = ref(0);
const selectedFile = ref(null);
const logs = ref([
  { time: '10:24:01', type: 'info', msg: '系统内核初始化完毕...' },
  { time: '10:24:03', type: 'success', msg: 'GPU 加速引擎已就绪 (NVIDIA RTX 4090)' }
]);

const linearGradient = [
  { color: '#6366f1', percentage: 0 },
  { color: '#2563eb', percentage: 100 },
];

// --- 表单与持久化 ---
const form = reactive({
  confidence: 0.25,
  skipFrames: 5,
  mode: 'real'
});

// --- 方法 ---
const handleFileChange = (file) => {
  selectedFile.value = file.raw;
  addLog(`导入视频文件: ${file.name}`, 'info');
};

const addLog = (msg, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ time, type, msg });
  if (logs.value.length > 8) logs.value.pop();
};

const submitTask = async () => {
  if (!selectedFile.value) return ElMessage.warning('请选择输入源');

  submitting.value = true;
  addLog('开始任务调度，正在分配计算资源...', 'info');

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('conf', form.confidence);

  try {
    const res = await axios.post('/api/upload', formData, {
      onUploadProgress: (p) => {
        uploadPercent.value = Math.round((p.loaded * 100) / p.total);
      }
    });
    addLog('数据传输完成，AI 引擎分析中...', 'success');
    ElMessage.success('任务处理请求已响应');
  } catch (e) {
    addLog('网络连接异常或后端拒绝服务', 'error');
  } finally {
    setTimeout(() => { submitting.value = false; }, 1000);
  }
};

const resetForm = () => {
  form.confidence = 0.25;
  form.skipFrames = 5;
  form.mode = 'real';
  addLog('用户重置算法参数', 'info');
};
</script>

<style scoped>
/* 基础变量 */
:root {
  --primary-color: #2563eb;
  --bg-color: #f1f5f9;
  --card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.app-wrapper {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1e293b;
}

/* 顶部导航 */
.main-header {
  height: 80px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left { display: flex; align-items: center; gap: 15px; }
.brand-logo {
  background: var(--primary-color);
  color: white;
  padding: 10px;
  border-radius: 12px;
}
.brand-text h1 { font-size: 18px; margin: 0; color: #0f172a; }
.brand-text p { font-size: 12px; margin: 0; color: #64748b; letter-spacing: 1px; }

/* 主布局 */
.main-content {
  display: flex;
  max-width: 1400px;
  margin: 30px auto;
  gap: 30px;
  padding: 0 20px;
}

.config-sidebar {
  width: 350px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  height: fit-content;
}

.task-area { flex: 1; display: flex; flex-direction: column; gap: 24px; }

/* 玻璃拟态卡片 */
.glass-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-header-title {
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
}

/* 表单细节 */
.custom-form .el-form-item { margin-bottom: 25px; }
.slider-value { text-align: right; font-family: monospace; font-weight: bold; color: var(--primary-color); }
.full-width { width: 100%; }
.input-tip { font-size: 12px; color: #94a3b8; margin-top: 5px; }

/* 上传区 */
.analysis-uploader :deep(.el-upload-dragger) {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  transition: all 0.3s;
}
.analysis-uploader :deep(.el-upload-dragger:hover) { border-color: var(--primary-color); background: #eff6ff; }

.upload-placeholder .el-icon--upload { font-size: 48px; color: #94a3b8; margin-bottom: 10px; }
.file-preview-box { display: flex; align-items: center; gap: 15px; padding: 20px; }
.file-icon { font-size: 32px; color: var(--primary-color); }
.file-details .name { display: block; font-weight: 600; font-size: 14px; }
.file-details .size { font-size: 12px; color: #64748b; }

/* 日志面板 */
.system-logs { background: #0f172a; color: #94a3b8; font-family: 'Consolas', monospace; }
.log-header { font-size: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px; color: #38bdf8; }
.log-content { height: 150px; overflow-y: auto; font-size: 13px; line-height: 1.6; }
.log-content p { margin: 4px 0; }
.log-content .time { color: #475569; }
.log-content .success { color: #4ade80; }
.log-content .error { color: #f87171; }

/* 按钮动画 */
.glow-button {
  box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39);
  padding: 25px 40px;
  font-size: 16px;
}

.workflow-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
.workflow-title { font-size: 13px; font-weight: bold; margin-bottom: 15px; color: #64748b; }

@media (max-width: 1000px) {
  .main-content { flex-direction: column; }
  .config-sidebar { width: auto; }
}
</style>