<template>
  <view class="upload-container">
    <view class="form-section">
      <view class="form-title">报告信息</view>
      
      <view class="form-item">
        <text class="label required">报告名称</text>
        <input class="input" v-model="form.reportName" placeholder="如：2025年度体检报告" />
      </view>

      <view class="form-item">
        <text class="label">报告类型</text>
        <picker :range="reportTypes" range-key="label" @change="onTypeChange">
          <view class="picker-value">
            {{ getTypeName(form.reportType) }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">检查日期</text>
        <picker mode="date" :value="form.reportDate" @change="onDateChange">
          <view class="picker-value">
            {{ form.reportDate || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">检查医院</text>
        <input class="input" v-model="form.hospital" placeholder="请输入医院名称" />
      </view>
    </view>

    <view class="form-section">
      <view class="form-title">上传报告文件</view>
      <view class="upload-area" @click="chooseFile">
        <view class="upload-content" v-if="!selectedFile">
          <text class="upload-icon">📤</text>
          <text class="upload-text">点击上传报告</text>
          <text class="upload-tip">支持PDF、JPG、PNG格式，最大10MB</text>
        </view>
        <view class="file-preview" v-else>
          <text class="file-icon">{{ getFileIcon(selectedFile.name) }}</text>
          <text class="file-name">{{ selectedFile.name }}</text>
          <text class="file-size">{{ formatFileSize(selectedFile.size) }}</text>
          <text class="remove-btn" @click.stop="removeFile">删除</text>
        </view>
      </view>
    </view>

    <view class="btn-area">
      <button class="submit-btn" :loading="uploading" @click="submit">
        {{ uploading ? '上传中...' : '确认上传' }}
      </button>
    </view>
  </view>
</template>

<script>
import { uploadFile, BASE_URL } from '@/utils/request.js'
import { getToken } from '@/utils/store.js'

export default {
  data() {
    return {
      form: {
        reportName: '',
        reportType: 'CHECKUP',
        reportDate: '',
        hospital: ''
      },
      reportTypes: [
        { value: 'CHECKUP', label: '体检报告' },
        { value: 'LAB', label: '化验单' },
        { value: 'IMAGING', label: '影像报告' },
        { value: 'OTHER', label: '其他' }
      ],
      selectedFile: null,
      filePath: '',
      uploading: false
    }
  },

  methods: {
    getTypeName(value) {
      const type = this.reportTypes.find(t => t.value === value)
      return type ? type.label : '请选择'
    },

    onTypeChange(e) {
      this.form.reportType = this.reportTypes[e.detail.value].value
    },

    onDateChange(e) {
      this.form.reportDate = e.detail.value
    },

    getFileIcon(name) {
      if (!name) return '📄'
      const ext = name.split('.').pop().toLowerCase()
      const icons = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' }
      return icons[ext] || '📄'
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    chooseFile() {
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['pdf', 'jpg', 'jpeg', 'png'],
        success: (res) => {
          const file = res.tempFiles[0]
          if (file.size > 10 * 1024 * 1024) {
            uni.showToast({ title: '文件不能超过10MB', icon: 'none' })
            return
          }
          this.selectedFile = file
          this.filePath = file.path
        },
        fail: () => {
          uni.chooseImage({
            count: 1,
            sourceType: ['album', 'camera'],
            success: (res) => {
              const tempFile = res.tempFiles[0]
              if (tempFile.size > 10 * 1024 * 1024) {
                uni.showToast({ title: '文件不能超过10MB', icon: 'none' })
                return
              }
              this.selectedFile = {
                name: res.tempFilePaths[0].split('/').pop(),
                size: tempFile.size,
                path: res.tempFilePaths[0]
              }
              this.filePath = res.tempFilePaths[0]
            }
          })
        }
      })
    },

    removeFile() {
      this.selectedFile = null
      this.filePath = ''
    },

    async submit() {
      if (!this.form.reportName) {
        uni.showToast({ title: '请输入报告名称', icon: 'none' })
        return
      }
      if (!this.filePath) {
        uni.showToast({ title: '请上传报告文件', icon: 'none' })
        return
      }

      this.uploading = true
      try {
        const token = getToken()
        uni.uploadFile({
          url: BASE_URL + '/api/v1/user/health/reports/upload',
          filePath: this.filePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + token
          },
          formData: {
            reportName: this.form.reportName,
            reportType: this.form.reportType,
            reportDate: this.form.reportDate,
            hospital: this.form.hospital
          },
          success: (uploadRes) => {
            const result = JSON.parse(uploadRes.data)
            if (result.code === 200) {
              uni.showToast({ title: '上传成功', icon: 'success' })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } else {
              uni.showToast({ title: result.message || '上传失败', icon: 'none' })
            }
          },
          fail: (err) => {
            console.error('上传失败', err)
            uni.showToast({ title: '上传失败', icon: 'error' })
          },
          complete: () => {
            this.uploading = false
          }
        })
      } catch (e) {
        this.uploading = false
        uni.showToast({ title: '上传失败', icon: 'error' })
      }
    }
  }
}
</script>

<style scoped>
.upload-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 200rpx;
}

.form-section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.form-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.required::before {
  content: '*';
  color: #f44336;
  margin-right: 8rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker-value {
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #333;
}

.arrow {
  color: #ccc;
  font-size: 32rpx;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background: #fafafa;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  word-break: break-all;
  text-align: center;
}

.file-size {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.remove-btn {
  font-size: 26rpx;
  color: #f44336;
  padding: 12rpx 30rpx;
  border: 1rpx solid #f44336;
  border-radius: 30rpx;
}

.btn-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
