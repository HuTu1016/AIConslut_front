<template>
  <view class="add-container">
    <view class="form-section">
      <view class="form-item">
        <text class="label required">疾病名称</text>
        <input class="input" v-model="form.diseaseName" placeholder="如：高血压、糖尿病" />
      </view>

      <view class="form-item">
        <text class="label">疾病类型</text>
        <picker :range="diseaseTypes" range-key="label" @change="onTypeChange">
          <view class="picker-value">
            {{ getTypeName(form.diseaseType) }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">确诊日期</text>
        <picker mode="date" :value="form.diagnosedDate" @change="onDateChange">
          <view class="picker-value">
            {{ form.diagnosedDate || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">确诊医院</text>
        <input class="input" v-model="form.hospital" placeholder="请输入医院名称" />
      </view>

      <view class="form-item">
        <text class="label">主治医生</text>
        <input class="input" v-model="form.doctorName" placeholder="请输入医生姓名" />
      </view>

      <view class="form-item">
        <text class="label">当前状态</text>
        <picker :range="statusList" range-key="label" @change="onStatusChange">
          <view class="picker-value">
            {{ getStatusName(form.currentStatus) }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">治疗方案</text>
        <textarea class="textarea" v-model="form.treatment" placeholder="请描述治疗方案" />
      </view>

      <view class="form-item">
        <text class="label">详细描述</text>
        <textarea class="textarea" v-model="form.description" placeholder="请描述病情详情" />
      </view>
    </view>

    <view class="btn-area">
      <button class="submit-btn" :loading="submitting" @click="submit">
        {{ submitting ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      form: {
        diseaseName: '',
        diseaseType: 'CHRONIC',
        diagnosedDate: '',
        hospital: '',
        doctorName: '',
        currentStatus: 'ONGOING',
        treatment: '',
        description: ''
      },
      diseaseTypes: [
        { value: 'CHRONIC', label: '慢性病' },
        { value: 'ACUTE', label: '急性病' },
        { value: 'SURGERY', label: '手术' },
        { value: 'INJURY', label: '外伤' }
      ],
      statusList: [
        { value: 'CURED', label: '已治愈' },
        { value: 'ONGOING', label: '治疗中' },
        { value: 'CONTROLLED', label: '已控制' }
      ],
      submitting: false
    }
  },

  methods: {
    getTypeName(value) {
      const type = this.diseaseTypes.find(t => t.value === value)
      return type ? type.label : '请选择'
    },

    getStatusName(value) {
      const status = this.statusList.find(s => s.value === value)
      return status ? status.label : '请选择'
    },

    onTypeChange(e) {
      this.form.diseaseType = this.diseaseTypes[e.detail.value].value
    },

    onDateChange(e) {
      this.form.diagnosedDate = e.detail.value
    },

    onStatusChange(e) {
      this.form.currentStatus = this.statusList[e.detail.value].value
    },

    async submit() {
      if (!this.form.diseaseName) {
        uni.showToast({ title: '请输入疾病名称', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        const res = await request({
          url: '/api/v1/user/health/history',
          method: 'POST',
          data: this.form
        })
        if (res.code === 200) {
          uni.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.message || '保存失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'error' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.add-container {
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

.textarea {
  width: 100%;
  min-height: 160rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 24rpx;
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
