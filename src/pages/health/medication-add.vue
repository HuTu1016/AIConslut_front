<template>
  <view class="add-container">
    <view class="form-section">
      <view class="form-item">
        <text class="label required">药品名称</text>
        <input class="input" v-model="form.medicineName" placeholder="如：阿司匹林、二甲双胍" />
      </view>

      <view class="form-item">
        <text class="label">药品类型</text>
        <picker :range="medicineTypes" range-key="label" @change="onTypeChange">
          <view class="picker-value">
            {{ getTypeName(form.medicineType) }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">剂量</text>
        <input class="input" v-model="form.dosage" placeholder="如：10mg、一片" />
      </view>

      <view class="form-item">
        <text class="label">服用频率</text>
        <input class="input" v-model="form.frequency" placeholder="如：每日2次、每周1次" />
      </view>

      <view class="form-item">
        <text class="label">用法</text>
        <input class="input" v-model="form.usageMethod" placeholder="如：口服、饭后服用" />
      </view>

      <view class="form-item">
        <text class="label">开始服用日期</text>
        <picker mode="date" :value="form.startDate" @change="onStartDateChange">
          <view class="picker-value">
            {{ form.startDate || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <view class="switch-row">
          <text class="label">长期用药</text>
          <switch :checked="form.isLongTerm === 1" @change="onLongTermChange" color="#667eea" />
        </view>
      </view>

      <view class="form-item" v-if="form.isLongTerm !== 1">
        <text class="label">结束日期</text>
        <picker mode="date" :value="form.endDate" @change="onEndDateChange">
          <view class="picker-value">
            {{ form.endDate || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">用药目的</text>
        <input class="input" v-model="form.purpose" placeholder="治疗什么疾病/症状" />
      </view>

      <view class="form-item">
        <text class="label">开具医生</text>
        <input class="input" v-model="form.prescribedBy" placeholder="请输入医生姓名" />
      </view>

      <view class="form-item">
        <text class="label">开药医院</text>
        <input class="input" v-model="form.hospital" placeholder="请输入医院名称" />
      </view>

      <view class="form-item">
        <text class="label">备注</text>
        <textarea class="textarea" v-model="form.notes" placeholder="其他需要说明的内容" />
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
        medicineName: '',
        medicineType: 'WESTERN',
        dosage: '',
        frequency: '',
        usageMethod: '',
        startDate: '',
        endDate: '',
        isLongTerm: 0,
        purpose: '',
        prescribedBy: '',
        hospital: '',
        notes: ''
      },
      medicineTypes: [
        { value: 'WESTERN', label: '西药' },
        { value: 'CHINESE', label: '中药' },
        { value: 'SUPPLEMENT', label: '保健品' }
      ],
      submitting: false
    }
  },

  methods: {
    getTypeName(value) {
      const type = this.medicineTypes.find(t => t.value === value)
      return type ? type.label : '请选择'
    },

    onTypeChange(e) {
      this.form.medicineType = this.medicineTypes[e.detail.value].value
    },

    onStartDateChange(e) {
      this.form.startDate = e.detail.value
    },

    onEndDateChange(e) {
      this.form.endDate = e.detail.value
    },

    onLongTermChange(e) {
      this.form.isLongTerm = e.detail.value ? 1 : 0
      if (this.form.isLongTerm === 1) {
        this.form.endDate = ''
      }
    },

    async submit() {
      if (!this.form.medicineName) {
        uni.showToast({ title: '请输入药品名称', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        const res = await request({
          url: '/api/v1/user/health/medications',
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

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-row .label {
  margin-bottom: 0;
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
