<template>
  <div class="app-container">
    <header class="system-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo-icon"><el-icon :size="26"><Cpu /></el-icon></div>
          <div class="title-group">
            <h1>道路病害智能检测平台</h1>
            <p>Road Damage Intelligent Detection System</p>
          </div>
        </div>
        <div class="status-area">
          <el-tag :type="submitting ? 'warning' : 'success'" effect="dark" round>
            {{ submitting ? '后端计算中' : '系统就绪' }}
          </el-tag>
          <el-divider direction="vertical" />
          <span class="node-text">计算节点：NVIDIA-RTX-Node-01</span>
        </div>
      </div>
    </header>

    <main class="main-layout">
      <aside class="config-sidebar glass-card">
        <div class="section-header">
          <el-icon><Operation /></el-icon> 算法参数配置
        </div>

        <el-form :model="form" label-position="top">
          <el-form-item label="检测置信度 (Confidence)">
            <template #label>
              <div class="label-info">置信度阈值 <el-tooltip content="过滤掉得分低于此值的检测结果"><el-icon><InfoFilled /></el-icon></el-tooltip></div>
            </template>
            <el-slider v-model="form.confidence" :min="0.1" :max="1" :step="0.01" />
            <div class="slider-display">{{ form.confidence.toFixed(2) }}</div>
          </el-form-item>

          <el-form-item label="推理模式">
            <el-select v-model="form.precision" placeholder="选择推理模式" class="w-100">
              <el-option label="极速预览 (INT8)" value="fast" />
              <el-option label="实时平衡 (FP16)" value="balanced" />
              <el-option label="高精度模式 (FP32)" value="precision" />
            </el-select>
          </el-form-item>

          <el-form-item label="抽帧采样频率">
            <el-input-number v-model="form.skipFrames" :min="1" :max="30" class="w-100" />
            <span class="hint">每隔 {{ form.skipFrames }} 帧进行一次 AI 识别</span>
          </el-form-item>
        </el-form>

        <div class="workflow-steps">
          <p class="workflow-title">处理阶段预览</p>
          <el-steps direction="vertical" :active="stepActive" finish-status="success" space="60px">
            <el-step title="视频流预处理" />
            <el-step title="YOLO 特征提取" />
            <el-step title="病害分级评价" />
            <el-step title="结果报表生成" />
          </el-steps>
        </div>
      </aside>

      <section class="content-main">
        <div class="upload-card glass-card">
          <div class="section-header">
            <el-icon><VideoCamera /></el-icon> 待分析数据源导入
          </div>

          <el-upload
            class="video-uploader"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            @change="handleFileChange"
          >
            <div v-if="!selectedFile" class="upload-inner">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                拖拽视频文件至此，或 <em>点击上传本地资源</em>
              </div>
            </div>
            <div v-else class="file-info-box">
              <div class="file-icon"><VideoPlay /></div>
              <div class="file-meta">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              </div>
              <el-button link type="primary" @click.stop="selectedFile = null">重新选择</el-button>
            </div>
          </el-upload>
        </div>

        <div class="action-card glass-card">
          <div v-if="submitting" class="progress-container">
            <div class="progress-text">
              <span>数据同步至云端推理服务器...</span>
              <span class="percentage">{{ uploadPercent }}%</span>
            </div>
            <el-progress
              :percentage="uploadPercent"
              :stroke-width="12"
              :color="customColors"
              striped
              striped-flow
              :show-text="false"
            />
          </div>

          <div class="btn-group">
            <el-button
              type="primary"
              size="large"
              class="main-submit-btn"
              :loading="submitting"
              @click="handleUpload"
            >
              {{ submitting ? '系统正在高速运算中...' : '启动 AI 行为检测' }}
            </el-button>
          </div>
        </div>

        <div class="log-card glass-card">
          <div class="log-header">
            <span>实时系统日志 (System Console)</span>
            <el-button link type="primary" size="small" @click="logs = []">清除</el-button>
          </div>
          <div class="log-viewport" ref="logContainer">
            <div v-for="(item, index) in logs" :key="index" :class="['log-line', item.type]">
              <span class="log-time">{{ item.time }}</span>
              <span class="log-msg">{{ item.msg }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Cpu, Operation, VideoCamera, UploadFilled, VideoPlay, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();

// --- 状态定义 ---
const submitting = ref(false);
const uploadPercent = ref(0);
const selectedFile = ref(null);
const stepActive = ref(0);
const logs = ref([]);
const logContainer = ref(null);

const customColors = [
  { color: '#93c5fd', percentage: 20 },
  { color: '#2563eb', percentage: 100 },
];

const form = reactive({
  confidence: 0.25,
  precision: 'balanced',
  skipFrames: 5
});

// --- 方法 ---

const addLog = (msg, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, msg, type });
  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const handleFileChange = (file) => {
  selectedFile.value = file.raw;
  addLog(`检测到本地资源加载: ${file.name}`, 'success');
};

const handleUpload = async () => {
  if (!selectedFile.value) {
    return ElMessage.warning('请先导入待检测视频源');
  }

  const formData = new FormData();
  formData.append('video', selectedFile.value);
  formData.append('conf', form.confidence);
  formData.append('mode', form.precision);

  submitting.value = true;
  uploadPercent.value = 0;
  stepActive.value = 1;
  addLog('正在建立 WebSocket 通信，初始化后端算力...', 'info');

  try {
    const res = await axios.post('/api/upload', formData, {
      onUploadProgress: (p) => {
        if (p.total) {
          uploadPercent.value = Math.round((p.loaded * 100) / p.total);
          if (uploadPercent.value > 60) stepActive.value = 2;
        }
      }
    });

    // 假设后端返回 code: 200，并携带任务 ID
    if (res.data.code === 200) {
      const taskId = res.data.data.id;
      addLog(`视频分析请求已响应，任务ID: ${taskId}。正在拉取结果...`, 'success');
      stepActive.value = 4;

      ElMessage.success('任务启动成功，即将展示分析结果');

      // 延迟 1.5 秒跳转，提升用户“系统在运算”的感知度
      setTimeout(() => {
        router.push({
          name: 'Result',
          params: { taskId: taskId } // 对应路由 /result/:taskId
        });
      }, 1500);

    } else {
      throw new Error(res.data.msg || '服务器返回异常');
    }

  } catch (error) {
    addLog(`服务通信异常: ${error.message}`, 'error');
    ElMessage.error('上传失败，请确保后端服务已启动');
    submitting.value = false;
  }
};

onMounted(() => {
  addLog('系统内核初始化完毕，GPU 加速已就绪。', 'info');
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f4f7fa;
  color: #1e293b;
}

/* 顶部栏 */
.system-header {
  background: #ffffff;
  height: 70px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand { display: flex; align-items: center; gap: 12px; }
.logo-icon {
  background: #2563eb;
  color: white;
  padding: 8px;
  border-radius: 10px;
}
.title-group h1 { font-size: 18px; margin: 0; color: #0f172a; font-weight: 700; }
.title-group p { font-size: 10px; margin: 0; color: #94a3b8; text-transform: uppercase; }

/* 侧边栏与主区 */
.main-layout {
  display: flex;
  max-width: 1400px;
  margin: 25px auto;
  gap: 25px;
  padding: 0 20px;
}

.config-sidebar { width: 300px; flex-shrink: 0; height: fit-content; }
.content-main { flex: 1; display: flex; flex-direction: column; gap: 20px; }

/* 玻璃卡片样式 */
.glass-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.section-header {
  font-weight: 700;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
}

.slider-display { text-align: right; font-weight: bold; color: #2563eb; }
.hint { font-size: 12px; color: #94a3b8; margin-top: 4px; display: block; }
.w-100 { width: 100%; }

/* 上传框美化 */
:deep(.el-upload-dragger) {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
}
:deep(.el-upload-dragger:hover) {
  border-color: #2563eb;
}

.file-info-box { display: flex; align-items: center; gap: 12px; padding: 15px; }
.file-icon { font-size: 28px; color: #2563eb; }
.file-name { font-weight: 600; font-size: 14px; }

/* 进度条与按钮 */
.progress-container { margin-bottom: 15px; }
.progress-text { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; font-weight: 600; color: #2563eb; }
.main-submit-btn { width: 100%; height: 50px; font-weight: bold; font-size: 16px; border-radius: 12px; }

/* 日志显示 */
.log-card { background: #1e293b; color: #cbd5e1; border: none; }
.log-header {
  display: flex;
  justify-content: space-between;
  color: #38bdf8;
  font-size: 12px;
  border-bottom: 1px solid #334155;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.log-viewport {
  height: 120px;
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}
.log-line { margin-bottom: 4px; }
.log-time { color: #64748b; margin-right: 8px; }
.success { color: #4ade80; }
.error { color: #f87171; }

@media (max-width: 900px) {
  .main-layout { flex-direction: column; }
  .config-sidebar { width: 100%; }
}
</style>