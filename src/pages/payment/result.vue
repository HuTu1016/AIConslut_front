<template>
  <view class="result-container">
    <view class="result-card" :class="status">
      <text class="icon">{{ status === 'success' ? '✅' : '⏳' }}</text>
      <text class="title">{{ status === 'success' ? '支付成功' : '待支付' }}</text>
      <!-- 待支付：显示实时倒计时 -->
      <view class="countdown-row" v-if="status === 'pending' && countdown > 0">
        <text class="countdown-label">请在</text>
        <text class="countdown-value">{{ countdownText }}</text>
        <text class="countdown-label">内支付</text>
      </view>
      <text class="desc" v-else-if="status === 'pending' && countdown === 0">支付超时，订单即将自动取消</text>
      <text class="desc" v-else-if="status === 'pending'">请稍候...</text>
      <text class="desc" v-else>预约已生效，请按时就诊</text>
    </view>
    
    <view class="info-card">
      <view class="info-item">
        <text class="label">预约单号</text>
        <text class="value">{{ ticketNo }}</text>
      </view>
      <view class="info-item">
        <text class="label">支付金额</text>
        <text class="value price">¥{{ amount }}</text>
      </view>
    </view>
    
    <view class="actions">
      <button class="btn btn-outline" @click="goAppointments">查看预约</button>
      <button class="btn btn-primary" @click="goHome">返回首页</button>
    </view>
  </view>
</template>

<script>
import { apiGetAppointmentDetail } from '@/utils/request.js'

// 与后端 RabbitMQConfig.ORDER_TTL 一致
const PAY_TIMEOUT_MS = 15 * 60 * 1000

export default {
  data() {
    return {
      status: 'success',
      appointmentId: '',
      ticketNo: '',
      amount: 0,
      countdown: -1, // -1=未加载, 0=已超时, >0=剩余秒数
      timer: null
    }
  },
  computed: {
    /** 将剩余秒数格式化为 mm:ss */
    countdownText() {
      if (this.countdown <= 0) return '00:00'
      const m = Math.floor(this.countdown / 60)
      const s = this.countdown % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
  },
  onLoad(options) {
    if (options.status) {
      this.status = options.status
    }
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
      this.loadAppointmentInfo()
    }
  },
  onUnload() {
    this.clearTimer()
  },
  methods: {
    async loadAppointmentInfo() {
      try {
        const res = await apiGetAppointmentDetail(this.appointmentId)
        if (res.data) {
          this.ticketNo = res.data.ticketNo || ''
          this.amount = res.data.amount || 0
          // 待支付状态启动倒计时
          if (this.status === 'pending') {
            this.startCountdown(res.data.createdAt)
          }
        }
      } catch (err) {
        console.error('加载预约信息失败:', err)
      }
    },

    /**
     * 根据创建时间启动倒计时
     */
    startCountdown(createdAt) {
      this.clearTimer()
      // 如果createdAt为空，用当前时间减去14分钟作为兆底（至少显示1分钟倒计时）
      const created = createdAt ? new Date(createdAt).getTime() : (Date.now() - 14 * 60 * 1000)
      const deadline = created + PAY_TIMEOUT_MS
      const remaining = Math.floor((deadline - Date.now()) / 1000)
      this.countdown = remaining > 0 ? remaining : 0

      if (this.countdown <= 0) return

      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.clearTimer()
        }
      }, 1000)
    },

    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    goAppointments() {
      uni.redirectTo({
        url: '/pages/appointment/list'
      })
    },
    
    goHome() {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style lang="scss">
.result-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding: 40rpx 30rpx;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 30rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  
  &.success {
    .icon {
      font-size: 120rpx;
    }
    
    .title {
      color: #6BB392;
    }
  }
  
  &.pending {
    .icon {
      font-size: 120rpx;
    }
    
    .title {
      color: #E8A87C;
    }
  }
  
  .title {
    font-size: 40rpx;
    font-weight: bold;
    margin-top: 30rpx;
  }
  
  .desc {
    font-size: 28rpx;
    color: #999;
    margin-top: 16rpx;
  }

  /* 倒计时行 */
  .countdown-row {
    display: flex;
    align-items: baseline;
    margin-top: 16rpx;

    .countdown-label {
      font-size: 28rpx;
      color: #E8A87C;
    }

    .countdown-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #FF4D4F;
      margin: 0 8rpx;
      font-variant-numeric: tabular-nums;
    }
  }
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    
    .label {
      font-size: 28rpx;
      color: #999;
    }
    
    .value {
      font-size: 28rpx;
      color: #333;
      
      &.price {
        color: #E8A87C;
        font-weight: bold;
      }
    }
  }
}

.actions {
  display: flex;
  gap: 20rpx;
  
  .btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    border-radius: 44rpx;
    
    &::after {
      border: none;
    }
    
    &.btn-primary {
      color: #fff;
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
    }
    
    &.btn-outline {
      color: #4A90D9;
      background: #fff;
      border: 2rpx solid #4A90D9;
    }
  }
}
</style>
