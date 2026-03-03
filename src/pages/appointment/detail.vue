<template>
  <view class="detail-container">
    <!-- 状态卡片 -->
    <view class="status-card" :class="'status-' + appointment.status">
      <text class="status-icon">{{ getStatusIcon(appointment.status) }}</text>
      <text class="status-text">{{ getStatusText(appointment.status) }}</text>
      <!-- 待支付状态：显示实时倒计时 -->
      <text class="status-desc" v-if="appointment.status === 0 && countdown > 0">
        请在 {{ countdownText }} 内支付
      </text>
      <text class="status-desc" v-else-if="appointment.status === 0 && countdown <= 0">
        支付超时，订单即将自动取消
      </text>
      <text class="status-desc" v-else-if="appointment.status === 10 && isAppointmentExpired">
        预约时间已过，等待系统自动取消
      </text>
      <text class="status-desc" v-else>{{ getStatusDesc(appointment.status) }}</text>
    </view>
    
    <!-- 医生信息 -->
    <view class="section">
      <view class="section-title">医生信息</view>
      <view class="doctor-info">
        <image class="avatar" :src="$resolveImage(appointment.doctorAvatar)" mode="aspectFill"></image>
        <view class="info">
          <view class="name-row">
            <text class="name">{{ appointment.doctorName }}</text>
            <text class="title">{{ appointment.doctorTitle }}</text>
          </view>
          <text class="dept">{{ appointment.departmentName }}</text>
        </view>
      </view>
    </view>
    
    <!-- 预约信息 -->
    <view class="section">
      <view class="section-title">预约信息</view>
      <view class="info-list">
        <view class="info-item">
          <text class="label">预约单号</text>
          <text class="value">{{ appointment.ticketNo }}</text>
        </view>
        <view class="info-item">
          <text class="label">就诊人</text>
          <text class="value">{{ appointment.patientName }}</text>
        </view>
        <view class="info-item">
          <text class="label">联系电话</text>
          <text class="value">{{ appointment.patientPhone }}</text>
        </view>
        <view class="info-item">
          <text class="label">预约时间</text>
          <text class="value highlight">{{ formatTime(appointment.appointmentTime) }}</text>
        </view>
        <view class="info-item">
          <text class="label">问诊费用</text>
          <text class="value price">¥{{ appointment.amount }}</text>
        </view>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="bottom-bar">
      <!-- 待支付 -->
      <template v-if="appointment.status === 0">
        <button class="btn btn-cancel" @click="handleCancel">取消预约</button>
        <button class="btn btn-primary" @click="handlePay">立即支付</button>
      </template>
      
      <!-- 待就诊 -->
      <template v-else-if="appointment.status === 10 && !isAppointmentExpired">
        <button class="btn btn-cancel" @click="handleCancel">取消预约</button>
        <button class="btn btn-primary" @click="goConsult">进入问诊</button>
      </template>
      <template v-else-if="appointment.status === 10 && isAppointmentExpired">
        <button class="btn btn-cancel full" @click="handleCancel">取消预约</button>
      </template>
      
      <!-- 就诊中 -->
      <template v-else-if="appointment.status === 20">
        <button class="btn btn-primary full" @click="goConsult">继续问诊</button>
      </template>
      
      <!-- 已完成 -->
      <template v-else-if="appointment.status === 30">
        <button class="btn btn-outline" @click="goRecord">查看病历</button>
        <button class="btn btn-primary" @click="goReview">评价医生</button>
      </template>
    </view>
  </view>
</template>

<script>
import { apiGetAppointmentDetail, apiCancelAppointment } from '@/utils/request.js'

// 自动取消超时时长（毫秒），与后端 RabbitMQConfig.ORDER_TTL 保持一致
const PAY_TIMEOUT_MS = 15 * 60 * 1000

export default {
  data() {
    return {
      appointmentId: '',
      appointment: {},
      countdown: 0, // 剩余秒数
      timer: null
    }
  },
  computed: {
    /** 判断待就诊订单预约时间是否已过 */
    isAppointmentExpired() {
      if (!this.appointment.appointmentTime) return false
      return new Date(this.appointment.appointmentTime).getTime() < Date.now()
    },
    /** 将剩余秒数格式化为 mm:ss */
    countdownText() {
      if (this.countdown <= 0) return '00:00'
      const m = Math.floor(this.countdown / 60)
      const s = this.countdown % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
  },
  onLoad(options) {
    if (options.id) {
      this.appointmentId = options.id
      this.loadDetail()
    }
  },
  onUnload() {
    // 页面销毁时清除定时器
    this.clearTimer()
  },
  methods: {
    async loadDetail() {
      try {
        const res = await apiGetAppointmentDetail(this.appointmentId)
        if (res.data) {
          this.appointment = res.data
          // 待支付状态启动倒计时
          if (this.appointment.status === 0) {
            this.startCountdown()
          }
        }
      } catch (err) {
        console.error('加载详情失败:', err)
        uni.showToast({ title: '加载详情失败', icon: 'none' })
      }
    },

    /**
     * 启动支付倒计时
     * 根据 createdAt + 15分钟 计算剩余时间
     */
    startCountdown() {
      this.clearTimer()
      const createdAt = new Date(this.appointment.createdAt).getTime()
      const deadline = createdAt + PAY_TIMEOUT_MS
      const remaining = Math.floor((deadline - Date.now()) / 1000)
      this.countdown = remaining > 0 ? remaining : 0

      if (this.countdown <= 0) return

      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.clearTimer()
          // 倒计时结束，刷新页面获取最新状态
          this.loadDetail()
        }
      }, 1000)
    },

    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    getStatusIcon(status) {
      const map = {
        0: '💰',
        10: '🕐',
        20: '💬',
        30: '✅',
        40: '❌',
        50: '💸'
      }
      return map[status] || '📋'
    },
    
    getStatusText(status) {
      const map = {
        0: '待支付',
        10: '待就诊',
        20: '就诊中',
        30: '已完成',
        40: '已取消',
        50: '已退款'
      }
      return map[status] || '未知'
    },
    
    getStatusDesc(status) {
      const map = {
        10: '请按时就诊，医生将在预约时间等候您',
        20: '问诊进行中，请注意查看医生回复',
        30: '感谢您的信任，祝您身体健康',
        40: '预约已取消',
        50: '退款已到账'
      }
      return map[status] || ''
    },
    
    handlePay() {
      uni.navigateTo({
        url: `/pages/payment/pay?appointmentId=${this.appointmentId}`
      })
    },
    
    async handleCancel() {
      uni.showModal({
        title: '提示',
        content: '确定要取消该预约吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await apiCancelAppointment(this.appointmentId)
              uni.showToast({ title: '取消成功', icon: 'success' })
              this.clearTimer()
              this.appointment.status = 40
            } catch (err) {
              console.error('取消失败:', err)
            }
          }
        }
      })
    },
    
    goConsult() {
      uni.navigateTo({
        url: `/pages/consult/chat?appointmentId=${this.appointmentId}&doctorId=${this.appointment.doctorId}&doctorName=${this.appointment.doctorName}`
      })
    },
    
    goRecord() {
      uni.navigateTo({
        url: `/pages/consult/record?appointmentId=${this.appointmentId}`
      })
    },
    
    goReview() {
      uni.showToast({ title: '评价功能开发中', icon: 'none' })
    },

    /** 格式化 ISO 时间字符串（去除 T，显示为 yyyy-MM-dd HH:mm） */
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const y = date.getFullYear()
      const M = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')
      return `${y}-${M}-${d} ${h}:${m}`
    }
  }
}
</script>

<style lang="scss">
.detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 160rpx;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx;
  background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
  
  &.status-0 {
    background: linear-gradient(135deg, #E8A87C, #F5C89A);
  }
  
  &.status-30, &.status-40, &.status-50 {
    background: linear-gradient(135deg, #9CA3AF, #D1D5DB);
  }
  
  .status-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .status-text {
    font-size: 40rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 12rpx;
  }
  
  .status-desc {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
  }
}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.doctor-info {
  display: flex;
  align-items: center;
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 20rpx;
    background: #f0f0f0;
  }
  
  .info {
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
}

.info-list {
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      font-size: 28rpx;
      color: #999;
    }
    
    .value {
      font-size: 28rpx;
      color: #333;
      
      &.highlight {
        color: #4A90D9;
        font-weight: 500;
      }
      
      &.price {
        color: #E8A87C;
        font-weight: bold;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  .btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    border-radius: 44rpx;
    margin: 0;
    
    &::after {
      border: none;
    }
    
    &.btn-primary {
      color: #fff;
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
    }
    
    &.btn-cancel {
      color: #666;
      background: #f5f5f5;
    }
    
    &.btn-outline {
      color: #4A90D9;
      background: #fff;
      border: 2rpx solid #4A90D9;
    }
    
    &.full {
      flex: none;
      width: 100%;
    }
  }
}
</style>
