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
            {{ submitting ? '任务提交中' : '系统就绪' }}
          </el-tag>
          <el-divider direction="vertical" />
          <span class="node-text">计算节点：Worker-Node</span>
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
              <div class="label-info">
                置信度阈值
                <el-tooltip content="过滤掉得分低于此值的检测结果">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-slider v-model="form.confidence" :min="0.1" :max="1" :step="0.01" />
            <div class="slider-display">{{ form.confidence.toFixed(2) }}</div>
          </el-form-item>

          <el-form-item label="推理模式">
            <el-select v-model="form.precision" placeholder="选择推理模式" class="w-100">
              <el-option label="极速预览" value="smoke" />
              <el-option label="真实检测" value="real" />
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
            <el-step title="视频上传" />
            <el-step title="任务创建" />
            <el-step title="Worker 处理" />
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
            accept=".mp4,.mov,.avi,.mkv,.webm,.m4v"
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
              <span>正在上传视频并创建云端任务...</span>
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
              {{ submitting ? '正在提交任务...' : '启动 AI 行为检测' }}
            </el-button>
          </div>
        </div>

        <div class="log-card glass-card">
          <div class="log-header">
            <span>实时系统日志 (System Console)</span>
            <el-button link type="primary" size="small" @click="logs = []">清除</el-button>
          </div>
          <div ref="logContainer" class="log-viewport">
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

// 改成你的 Render 后端地址。
// 注意：你的 FastAPI router 是 @router.post("/upload")，所以这里请求 `${API_BASE}/upload`
const API_BASE = 'https://road-damage-backend-1.onrender.com';

const submitting = ref(false);
const uploadPercent = ref(0);
const selectedFile = ref(null);
const stepActive = ref(0);
const logs = ref([]);
const logContainer = ref(null);

const customColors = [
  { color: '#93c5fd', percentage: 20 },
  { color: '#2563eb', percentage: 100 }
];

const form = reactive({
  confidence: 0.25,
  precision: 'real',
  skipFrames: 5
});

const addLog = (msg, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, msg, type });

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

  // 后端 upload.py 接收的是 file、confidence、skip_frames、mode
  formData.append('file', selectedFile.value);
  formData.append('confidence', String(form.confidence));
  formData.append('skip_frames', String(form.skipFrames));
  formData.append('mode', form.precision);

  submitting.value = true;
  uploadPercent.value = 0;
  stepActive.value = 1;
  addLog('正在上传视频到云端任务服务器...', 'info');

  try {
    const res = await axios.post(`${API_BASE}/api/upload`, formData, {
      onUploadProgress: (p) => {
        if (p.total) {
          uploadPercent.value = Math.round((p.loaded * 100) / p.total);
          if (uploadPercent.value > 60) {
            stepActive.value = 2;
          }
        }
      }
    });

    console.log('上传接口返回:', res.data);

    const data = res.data;

    if (!data) {
      throw new Error('后端返回为空');
    }

    // 后端当前返回的是 task_id
    const taskId =
      data.task_id ||
      data.taskId ||
      data?.data?.id ||
      data?.id;

    if (!taskId) {
      throw new Error(data.message || '服务器没有返回 task_id');
    }

    addLog(`任务创建成功，任务ID: ${taskId}，等待 worker 处理...`, 'success');
    uploadPercent.value = 100;
    stepActive.value = 4;

    ElMessage.success('任务启动成功，即将进入结果页面');

    setTimeout(() => {
      router.push({
        name: 'Result',
        params: { taskId }
      });
    }, 1200);
  } catch (error) {
    console.error('上传失败:', error);

    const msg =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      '未知错误';

    addLog(`服务通信异常: ${msg}`, 'error');
    ElMessage.error(`上传失败：${msg}`);

    submitting.value = false;
    uploadPercent.value = 0;
    stepActive.value = 0;
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

.main-layout {
  display: flex;
  max-width: 1400px;
  margin: 25px auto;
  gap: 25px;
  padding: 0 20px;
}

.config-sidebar { width: 300px; flex-shrink: 0; height: fit-content; }
.content-main { flex: 1; display: flex; flex-direction: column; gap: 20px; }

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

.label-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slider-display { text-align: right; font-weight: bold; color: #2563eb; }
.hint { font-size: 12px; color: #94a3b8; margin-top: 4px; display: block; }
.w-100 { width: 100%; }

.workflow-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin: 8px 0 14px;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
}

:deep(.el-upload-dragger:hover) {
  border-color: #2563eb;
}

.upload-inner {
  padding: 25px 0;
}

.file-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
}

.file-icon { font-size: 28px; color: #2563eb; }

.file-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.file-name { font-weight: 600; font-size: 14px; color: #0f172a; }
.file-size { font-size: 12px; color: #94a3b8; margin-top: 4px; }

.progress-container { margin-bottom: 15px; }

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2563eb;
}

.main-submit-btn {
  width: 100%;
  height: 50px;
  font-weight: bold;
  font-size: 16px;
  border-radius: 12px;
}

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