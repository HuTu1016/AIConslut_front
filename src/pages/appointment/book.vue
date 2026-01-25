<template>
  <view class="book-container">
    <!-- 医生信息 -->
    <view class="doctor-info">
      <image class="avatar" :src="doctor.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="info">
        <view class="name-row">
          <text class="name">{{ doctor.name }}</text>
          <text class="title">{{ doctor.title }}</text>
        </view>
        <text class="dept">{{ doctor.departmentName }}</text>
      </view>
      <view class="schedule-info">
        <text class="date">{{ scheduleInfo.date }}</text>
        <text class="time">{{ scheduleInfo.time }}</text>
      </view>
    </view>
    
    <!-- 就诊人信息 -->
    <view class="section">
      <view class="section-title">就诊人信息</view>
      <view class="form">
        <view class="form-item">
          <text class="label">姓名</text>
          <input 
            class="input" 
            type="text" 
            v-model="form.patientName" 
            placeholder="请输入就诊人姓名"
          />
        </view>
        <view class="form-item">
          <text class="label">手机号</text>
          <input 
            class="input" 
            type="tel" 
            v-model="form.patientPhone" 
            placeholder="请输入联系电话"
            maxlength="11"
          />
        </view>
        <view class="form-item">
          <text class="label">症状描述</text>
          <textarea 
            class="textarea" 
            v-model="form.symptom" 
            placeholder="请简要描述您的症状（选填）"
            maxlength="200"
          ></textarea>
        </view>
      </view>
    </view>
    
    <!-- 费用信息 -->
    <view class="section">
      <view class="section-title">费用明细</view>
      <view class="fee-list">
        <view class="fee-item">
          <text class="name">问诊费</text>
          <text class="amount">¥{{ doctor.consultPrice }}</text>
        </view>
        <view class="fee-item total">
          <text class="name">合计</text>
          <text class="amount">¥{{ doctor.consultPrice }}</text>
        </view>
      </view>
    </view>
    
    <!-- 温馨提示 -->
    <view class="tips">
      <text class="title">温馨提示</text>
      <text class="content">1. 请按时就诊，如需取消请提前2小时操作</text>
      <text class="content">2. 问诊费用支持微信支付</text>
      <text class="content">3. 如有疑问请联系客服</text>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="label">应付金额</text>
        <text class="price">¥{{ doctor.consultPrice }}</text>
      </view>
      <button class="submit-btn" @click="handleSubmit" :loading="loading" :disabled="loading">
        确认预约
      </button>
    </view>
  </view>
</template>

<script>
import { apiCreateAppointment, apiCreatePayment, apiGetDoctorDetail } from '@/utils/request.js'

export default {
  data() {
    return {
      doctorId: '',
      scheduleId: '',
      loading: false,
      doctor: {
        id: '',
        name: '',
        title: '',
        departmentName: '',
        consultPrice: 0,
        avatarUrl: ''
      },
      scheduleInfo: {
        date: '',
        time: ''
      },
      form: {
        patientName: '',
        patientPhone: '',
        symptom: ''
      }
    }
  },
  onLoad(options) {
    if (options.doctorId) {
      this.doctorId = options.doctorId
      this.loadDoctorInfo()
    }
    if (options.scheduleId) {
      this.scheduleId = options.scheduleId
    }
    // 从URL解析排班信息
    if (options.date) {
      this.scheduleInfo.date = options.date
    }
    if (options.time) {
      this.scheduleInfo.time = decodeURIComponent(options.time)
    }
  },
  methods: {
    async loadDoctorInfo() {
      try {
        const res = await apiGetDoctorDetail(this.doctorId)
        if (res.data) {
          this.doctor = res.data
        }
      } catch (err) {
        console.error('加载医生信息失败:', err)
        uni.showToast({ title: '加载医生信息失败', icon: 'none' })
      }
    },
    
    validateForm() {
      if (!this.form.patientName.trim()) {
        uni.showToast({ title: '请输入就诊人姓名', icon: 'none' })
        return false
      }
      if (!this.form.patientPhone.trim()) {
        uni.showToast({ title: '请输入联系电话', icon: 'none' })
        return false
      }
      if (!/^1[3-9]\d{9}$/.test(this.form.patientPhone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return false
      }
      return true
    },
    
    async handleSubmit() {
      if (!this.validateForm()) return
      
      this.loading = true
      
      try {
        // 1. 创建预约订单
        const appointmentRes = await apiCreateAppointment({
          doctorId: this.doctorId,
          scheduleId: this.scheduleId,
          patientName: this.form.patientName,
          patientPhone: this.form.patientPhone,
          symptom: this.form.symptom
        })
        
        const appointmentId = appointmentRes.data.id
        
        // 2. 创建支付订单
        const paymentRes = await apiCreatePayment({
          appointmentId: appointmentId
        })
        
        // 3. 调起微信支付
        const payParams = paymentRes.data
        
        // 模拟支付成功（实际需要调用微信支付）
        uni.showModal({
          title: '模拟支付',
          content: `支付金额：¥${this.doctor.consultPrice}`,
          confirmText: '支付成功',
          cancelText: '取消支付',
          success: (res) => {
            if (res.confirm) {
              uni.redirectTo({
                url: `/pages/payment/result?status=success&appointmentId=${appointmentId}`
              })
            } else {
              uni.redirectTo({
                url: `/pages/payment/result?status=pending&appointmentId=${appointmentId}`
              })
            }
          }
        })
        
      } catch (err) {
        console.error('预约失败:', err)
        uni.showToast({
          title: err.message || '预约失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.book-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 160rpx;
}

.doctor-info {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    background: #f0f0f0;
  }
  
  .info {
    flex: 1;
    margin-left: 20rpx;
    
    .name-row {
      display: flex;
      align-items: center;
      
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      
      .title {
        margin-left: 12rpx;
        font-size: 24rpx;
        color: #4A90D9;
      }
    }
    
    .dept {
      display: block;
      margin-top: 8rpx;
      font-size: 26rpx;
      color: #999;
    }
  }
  
  .schedule-info {
    text-align: right;
    
    .date {
      display: block;
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
    }
    
    .time {
      display: block;
      margin-top: 8rpx;
      font-size: 24rpx;
      color: #4A90D9;
    }
  }
}

.section {
  margin-top: 20rpx;
  background: #fff;
  padding: 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.form {
  .form-item {
    margin-bottom: 24rpx;
    
    .label {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 12rpx;
    }
    
    .input {
      height: 88rpx;
      padding: 0 24rpx;
      background: #F5F7FA;
      border-radius: 12rpx;
      font-size: 28rpx;
    }
    
    .textarea {
      width: 100%;
      height: 200rpx;
      padding: 24rpx;
      background: #F5F7FA;
      border-radius: 12rpx;
      font-size: 28rpx;
      box-sizing: border-box;
    }
  }
}

.fee-list {
  .fee-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    
    .name {
      font-size: 28rpx;
      color: #666;
    }
    
    .amount {
      font-size: 28rpx;
      color: #333;
    }
    
    &.total {
      border-top: 1rpx solid #f0f0f0;
      padding-top: 24rpx;
      margin-top: 16rpx;
      
      .name {
        font-weight: bold;
        color: #333;
      }
      
      .amount {
        font-weight: bold;
        color: #E8A87C;
        font-size: 32rpx;
      }
    }
  }
}

.tips {
  margin: 20rpx 30rpx;
  padding: 24rpx;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 12rpx;
  
  .title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #4A90D9;
    margin-bottom: 12rpx;
  }
  
  .content {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.8;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  .price-info {
    .label {
      display: block;
      font-size: 24rpx;
      color: #999;
    }
    
    .price {
      font-size: 40rpx;
      font-weight: bold;
      color: #E8A87C;
    }
  }
  
  .submit-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    margin-left: 30rpx;
    font-size: 32rpx;
    color: #fff;
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    border-radius: 44rpx;
    
    &::after {
      border: none;
    }
  }
}
</style>
