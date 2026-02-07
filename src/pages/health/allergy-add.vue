<template>
  <view class="add-container">
    <view class="form-section">
      <view class="form-item">
        <text class="label required">过敏原</text>
        <input class="input" v-model="form.allergen" placeholder="如：青霉素、花生、海鲜" />
      </view>

      <view class="form-item">
        <text class="label">过敏原类型</text>
        <picker :range="allergenTypes" range-key="label" @change="onTypeChange">
          <view class="picker-value">
            {{ getTypeName(form.allergenType) }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">严重程度</text>
        <view class="severity-options">
          <view class="severity-item" 
                v-for="item in severityList" 
                :key="item.value"
                :class="{ active: form.severity === item.value, [item.value.toLowerCase()]: true }"
                @click="form.severity = item.value">
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">首次发生日期</text>
        <picker mode="date" :value="form.firstOccurred" @change="onDateChange">
          <view class="picker-value">
            {{ form.firstOccurred || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">过敏症状</text>
        <textarea class="textarea" v-model="form.symptoms" placeholder="描述过敏时的症状表现" />
      </view>

      <view class="form-item">
        <text class="label">确诊医生</text>
        <input class="input" v-model="form.confirmedBy" placeholder="请输入医生姓名" />
      </view>

      <view class="form-item">
        <text class="label">备注</text>
        <textarea class="textarea" v-model="form.notes" placeholder="其他需要说明的内容" />
      </view>
    </view>

    <view class="warning-tips">
      <text class="tip-icon">⚠️</text>
      <text class="tip-text">过敏信息非常重要，会在问诊时提供给医生参考，请务必如实填写</text>
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
        allergen: '',
        allergenType: 'MEDICINE',
        severity: 'MILD',
        firstOccurred: '',
        symptoms: '',
        confirmedBy: '',
        notes: ''
      },
      allergenTypes: [
        { value: 'MEDICINE', label: '药物过敏' },
        { value: 'FOOD', label: '食物过敏' },
        { value: 'ENVIRONMENT', label: '环境过敏' },
        { value: 'OTHER', label: '其他' }
      ],
      severityList: [
        { value: 'MILD', label: '轻度' },
        { value: 'MODERATE', label: '中度' },
        { value: 'SEVERE', label: '重度' }
      ],
      submitting: false
    }
  },

  methods: {
    getTypeName(value) {
      const type = this.allergenTypes.find(t => t.value === value)
      return type ? type.label : '请选择'
    },

    onTypeChange(e) {
      this.form.allergenType = this.allergenTypes[e.detail.value].value
    },

    onDateChange(e) {
      this.form.firstOccurred = e.detail.value
    },

    async submit() {
      if (!this.form.allergen) {
        uni.showToast({ title: '请输入过敏原', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        const res = await request({
          url: '/api/v1/user/health/allergies',
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

.severity-options {
  display: flex;
  gap: 20rpx;
}

.severity-item {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f5f7fa;
  color: #666;
  transition: all 0.3s;
}

.severity-item.active.mild {
  background: #e8f5e9;
  color: #4caf50;
  border: 2rpx solid #4caf50;
}

.severity-item.active.moderate {
  background: #fff3e0;
  color: #ff9800;
  border: 2rpx solid #ff9800;
}

.severity-item.active.severe {
  background: #ffebee;
  color: #f44336;
  border: 2rpx solid #f44336;
}

.warning-tips {
  display: flex;
  align-items: flex-start;
  background: #fff3e0;
  margin: 30rpx;
  padding: 24rpx;
  border-radius: 12rpx;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #ff9800;
  line-height: 1.6;
  flex: 1;
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
