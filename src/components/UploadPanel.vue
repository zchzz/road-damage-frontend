<template>
  <el-card shadow="hover" class="upload-card">
    <template #header>
      <div class="card-header">上传视频并开始检测</div>
    </template>

    <el-form label-width="100px">
      <el-form-item label="视频文件">
        <el-upload
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :show-file-list="true"
        >
          <el-button type="primary">选择视频</el-button>
        </el-upload>
      </el-form-item>

      <el-form-item label="解析模式">
        <el-radio-group v-model="form.mode">
          <el-radio label="online">在线解析</el-radio>
          <el-radio label="offline">离线解析</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="置信度">
        <el-slider v-model="form.confidence" :min="0.1" :max="1" :step="0.05" show-input />
      </el-form-item>

      <el-form-item label="跳帧数">
        <el-input-number v-model="form.skipFrames" :min="1" :max="10" />
      </el-form-item>

      <el-form-item>
        <el-button type="success" :loading="submitting" @click="submit">
          开始解析
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadVideo } from '../api/upload'

const emit = defineEmits(['submitted'])

const submitting = ref(false)
const currentFile = ref(null)

const form = reactive({
  mode: 'online',
  confidence: 0.3,
  skipFrames: 1
})

function handleFileChange(file) {
  currentFile.value = file.raw
}

async function submit() {
  if (!currentFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  try {
    submitting.value = true
    const res = await uploadVideo({
      file: currentFile.value,
      mode: form.mode,
      confidence: form.confidence,
      skipFrames: form.skipFrames
    })
    ElMessage.success('任务创建成功')
    emit('submitted', res)
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.upload-card {
  max-width: 760px;
  margin: 0 auto;
}
.card-header {
  font-size: 18px;
  font-weight: bold;
}
</style>