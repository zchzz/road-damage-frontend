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
            {{ submitting ? '系统计算中' : '系统就绪' }}
          </el-tag>
          <el-divider direction="vertical" />
          <span class="node-text">计算节点：边缘计算服务器-04</span>
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
              <div class="label-info">置信度 <el-tooltip content="阈值越高，检测结果越精确但可能漏检"><el-icon><InfoFilled /></el-icon></el-tooltip></div>
            </template>
            <el-slider v-model="form.confidence" :min="0.1" :max="1" :step="0.01" />
            <div class="slider-display">{{ form.confidence.toFixed(2) }}</div>
          </el-form-item>

          <el-form-item label="分析精度">
            <el-select v-model="form.precision" placeholder="选择推理模式" class="w-100">
              <el-option label="极速模式 (INT8)" value="fast" />
              <el-option label="均衡模式 (FP16)" value="balanced" />
              <el-option label="高精度模式 (FP32)" value="precision" />
            </el-select>
          </el-form-item>

          <el-form-item label="抽帧频率 (Frame Skip)">
            <el-input-number v-model="form.skipFrames" :min="1" :max="30" class="w-100" />
            <span class="hint">每隔 {{ form.skipFrames }} 帧进行一次 AI 识别</span>
          </el-form-item>
        </el-form>

        <div class="workflow-steps">
          <p class="workflow-title">处理阶段预览</p>
          <el-steps direction="vertical" :active="stepActive" finish-status="success" space="60px">
            <el-step title="视频流解码" />
            <el-step title="YOLO 目标提取" />
            <el-step title="病害分级评价" />
            <el-step title="生成分析报告" />
          </el-steps>
        </div>
      </aside>

      <section class="content-main">
        <div class="upload-card glass-card">
          <div class="section-header">
            <el-icon><VideoCamera /></el-icon> 原始数据导入
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
                拖拽道路监控视频至此，或 <em>点击上传本地文件</em>
              </div>
            </div>
            <div v-else class="file-info-box">
              <div class="file-icon"><VideoPlay /></div>
              <div class="file-meta">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              </div>
              <el-button link type="primary" @click.stop="selectedFile = null">更换文件</el-button>
            </div>
          </el-upload>
        </div>

        <div class="action-card glass-card">
          <div v-if="submitting" class="progress-container">
            <div class="progress-text">
              <span>数据传输同步中 (Uploader)</span>
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
              {{ submitting ? '系统正在处理视频数据...' : '开始执行病害检测' }}
            </el-button>
          </div>
        </div>

        <div class="log-card glass-card">
          <div class="log-header">
            <span>实时系统日志</span>
            <el-button link type="primary" size="small" @click="logs = []">清空</el-button>
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
import { useRouter } from 'vue-router'; // 导入路由
import { Cpu, Operation, VideoCamera, UploadFilled, VideoPlay, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter(); // 初始化路由

// --- 状态变量 ---
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
  confidence: 0.45,
  precision: 'balanced',
  skipFrames: 5
});

// --- 方法 ---

// 记录日志
const addLog = (msg, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, msg, type });
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 文件选择
const handleFileChange = (file) => {
  selectedFile.value = file.raw;
  addLog(`已加载本地视频资源: ${file.name}`, 'success');
};

// 核心：上传并跳转
const handleUpload = async () => {
  if (!selectedFile.value) {
    return ElMessage.warning('请先选择需要分析的视频文件');
  }

  const formData = new FormData();
  formData.append('video', selectedFile.value);
  formData.append('conf', form.confidence);
  formData.append('mode', form.precision);
  formData.append('skip', form.skipFrames);

  submitting.value = true;
  uploadPercent.value = 0;
  stepActive.value = 1;
  addLog('开始初始化计算后端，正在建立 WebSocket 通信...', 'info');

  try {
    const res = await axios.post('/api/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (uploadPercent.value > 50) stepActive.value = 2;
        }
      }
    });

    // 假设后端成功返回 code: 200 和 data.id (任务ID)
    if (res.data.code === 200) {
      const taskId = res.data.data.id;
      addLog(`任务提交成功，任务ID: ${taskId}。正在跳转至分析结果页...`, 'success');
      stepActive.value = 4;

      ElMessage({
        message: '上传成功！即将显示分析结果',
        type: 'success',
        duration: 2000
      });

      // 延迟跳转，给用户一点心理反馈时间
      setTimeout(() => {
        router.push({
          name: 'Result',
          params: { taskId: taskId }
        });
      }, 1500);

    } else {
      throw new Error(res.data.msg || '服务器返回异常');
    }

  } catch (error) {
    console.error(error);
    addLog(`服务请求失败: ${error.message}`, 'error');
    ElMessage.error('上传失败，请检查后端 API 连接');
    submitting.value = false;
  }
};

onMounted(() => {
  addLog('检测平台内核已就绪，GPU 加速已启用。', 'info');
});
</script>

<style scoped>
/* 整体背景：浅灰科技感 */
.app-container {
  min-height: 100vh;
  background: #f1f5f9;
  background-image:
    radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.03) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.03) 0px, transparent 50%);
}

/* 顶部导航 */
.system-header {
  background: #ffffff;
  height: 80px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand { display: flex; align-items: center; gap: 15px; }
.logo-icon {
  background: #2563eb;
  color: white;
  padding: 10px;
  border-radius: 12px;
}
.title-group h1 { font-size: 20px; margin: 0; color: #0f172a; font-weight: 800; }
.title-group p { font-size: 11px; margin: 0; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }

.node-text { font-size: 13px; color: #64748b; font-weight: 500; }

/* 布局 */
.main-layout {
  display: flex;
  max-width: 1400px;
  margin: 30px auto;
  gap: 25px;
  padding: 0 20px;
}

.config-sidebar { width: 320px; flex-shrink: 0; height: fit-content; }
.content-main { flex: 1; display: flex; flex-direction: column; gap: 25px; }

/* 玻璃拟态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 24px;
}

.section-header {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  border-left: 4px solid #2563eb;
  padding-left: 12px;
}

/* 侧边栏细节 */
.label-info { display: flex; align-items: center; gap: 5px; }
.slider-display { text-align: right; font-weight: bold; color: #2563eb; font-family: monospace; }
.hint { font-size: 12px; color: #94a3b8; }
.w-100 { width: 100%; }
.workflow-info { margin-top: 30px; }
.workflow-title { font-size: 12px; font-weight: bold; color: #94a3b8; margin-bottom: 20px; }

/* 上传组件覆盖 */
:deep(.el-upload-dragger) {
  border: 2px dashed #e2e8f0;
  background: #f8fafc;
  transition: all 0.3s;
}
:deep(.el-upload-dragger:hover) {
  border-color: #2563eb;
  background: #eff6ff;
}

.file-info-box {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}
.file-icon { font-size: 30px; color: #2563eb; }
.file-name { display: block; font-weight: 600; font-size: 14px; color: #1e293b; }
.file-size { font-size: 12px; color: #64748b; }

/* 进度条与按钮 */
.progress-container { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 10px; }
.progress-text { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: bold; color: #2563eb; }
.main-submit-btn { width: 100%; height: 56px; font-size: 16px; font-weight: bold; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }

/* 日志窗口 (程序员风格) */
.log-card { background: #0f172a; color: #e2e8f0; border: none; }
.log-header {
  display: flex;
  justify-content: space-between;
  color: #38bdf8;
  font-size: 12px;
  margin-bottom: 10px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 8px;
}
.log-viewport {
  height: 140px;
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.8;
}
.log-line { margin-bottom: 4px; }
.log-time { color: #475569; margin-right: 10px; }
.success { color: #4ade80; }
.error { color: #f87171; }

/* 滚动条美化 */
.log-viewport::-webkit-scrollbar { width: 4px; }
.log-viewport::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }

@media (max-width: 1000px) {
  .main-layout { flex-direction: column; }
  .config-sidebar { width: 100%; }
}
</style>