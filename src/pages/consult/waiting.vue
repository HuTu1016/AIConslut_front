<template>
  <view class="waiting-container">
    <!-- 顶部状态 -->
    <view class="status-card" :class="statusClass">
      <text class="status-icon">{{ statusIcon }}</text>
      <text class="status-title">{{ statusTitle }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 排队信息 -->
    <view class="queue-card" v-if="status === 'waiting'">
      <view class="queue-position">
        <text class="position-label">当前排队位置</text>
        <text class="position-number">第 {{ queuePosition }} 位</text>
      </view>
      <view class="queue-info">
        <view class="info-item">
          <text class="label">预约时间</text>
          <text class="value">{{ appointmentTime }}</text>
        </view>
        <view class="info-item">
          <text class="label">就诊医生</text>
          <text class="value">{{ doctorName }}</text>
        </view>
        <view class="info-item">
          <text class="label">预约单号</text>
          <text class="value">{{ ticketNo }}</text>
        </view>
      </view>
    </view>

    <!-- 叫号提示 -->
    <view class="called-card" v-if="status === 'called'">
      <text class="called-icon">🔔</text>
      <text class="called-text">轮到您就诊了！</text>
      <text class="called-hint">请尽快进入问诊聊天室</text>
      <button class="enter-btn" @click="enterChat">进入聊天室</button>
    </view>

    <!-- 温馨提示 -->
    <view class="tips" v-if="status === 'waiting'">
      <text class="tips-title">温馨提示</text>
      <text class="tips-item">1. 请保持页面打开，叫号时会自动弹窗提醒</text>
      <text class="tips-item">2. 如需离开页面，叫号通知也会通过消息推送</text>
      <text class="tips-item">3. 叫到号后请在5分钟内进入聊天室</text>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <button class="btn-outline" @click="goAppointments">查看预约</button>
      <button class="btn-outline" @click="goHome">返回首页</button>
    </view>
  </view>
</template>

<script>
import { apiGetAppointmentDetail } from '@/utils/request.js'
import { connectNotifyWs, closeNotifyWs, onNotify, offNotify } from '@/utils/notify-ws.js'

export default {
  data() {
    return {
      appointmentId: '',
      status: 'waiting', // waiting / called
      queuePosition: 0,
      appointmentTime: '',
      doctorName: '',
      ticketNo: '',
      userId: ''
    }
  },
  computed: {
    statusClass() {
      return this.status === 'called' ? 'called' : 'waiting'
    },
    statusIcon() {
      return this.status === 'called' ? '🔔' : '⏳'
    },
    statusTitle() {
      return this.status === 'called' ? '轮到您了' : '排队等候中'
    },
    statusDesc() {
      if (this.status === 'called') return '请立即进入问诊聊天室'
      return this.queuePosition > 0 ? `前面还有 ${this.queuePosition - 1} 人` : '正在获取排队信息...'
    }
  },
  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
      this.loadAppointmentInfo()
    }
    // 获取用户ID（开发模式使用1）
    this.userId = uni.getStorageSync('userId') || '1'
    
    // 连接通知 WebSocket
    connectNotifyWs(this.userId)
    
    // 监听叫号和排队变动
    onNotify('CALL_NUMBER', this.handleCallNumber)
    onNotify('QUEUE_UPDATE', this.handleQueueUpdate)
  },
  onUnload() {
    // 移除监听（不关闭WS连接，其他页面可能还需要）
    offNotify('CALL_NUMBER', this.handleCallNumber)
    offNotify('QUEUE_UPDATE', this.handleQueueUpdate)
  },
  methods: {
    async loadAppointmentInfo() {
      try {
        const res = await apiGetAppointmentDetail(this.appointmentId)
        if (res.data) {
          this.ticketNo = res.data.ticketNo || ''
          this.appointmentTime = res.data.appointmentTime || ''
          this.doctorName = res.data.doctorName || ''
          this.queuePosition = res.data.queuePosition || 0
          // 如果已经是就诊中状态，直接显示叫号
          if (res.data.status === 20) {
            this.status = 'called'
          }
        }
      } catch (err) {
        console.error('加载预约信息失败:', err)
      }
    },
    
    /** 收到叫号通知 */
    handleCallNumber(data) {
      if (String(data.appointmentId) === String(this.appointmentId)) {
        this.status = 'called'
        // 振动提醒
        uni.vibrateShort()
      }
    },
    
    /** 收到排队变动通知 */
    handleQueueUpdate(data) {
      if (String(data.appointmentId) === String(this.appointmentId)) {
        this.queuePosition = data.queuePosition || this.queuePosition
      }
    },
    
    /** 进入聊天室 */
    enterChat() {
      uni.redirectTo({
        url: `/pages/consult/chat?appointmentId=${this.appointmentId}`
      })
    },
    
    goAppointments() {
      uni.redirectTo({ url: '/pages/appointment/list' })
    },
    
    goHome() {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}
</script>

<style lang="scss">
.waiting-container {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 30rpx;
  padding-bottom: 200rpx;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  
  &.waiting {
    .status-icon { font-size: 100rpx; }
    .status-title { color: #E8A87C; }
  }
  
  &.called {
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    .status-icon { font-size: 100rpx; }
    .status-title { color: #fff; }
    .status-desc { color: rgba(255,255,255,0.8); }
  }
  
  .status-title {
    font-size: 40rpx;
    font-weight: bold;
    margin-top: 20rpx;
  }
  
  .status-desc {
    font-size: 28rpx;
    color: #999;
    margin-top: 12rpx;
  }
}

.queue-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .queue-position {
    text-align: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    margin-bottom: 20rpx;
    
    .position-label {
      display: block;
      font-size: 26rpx;
      color: #999;
    }
    
    .position-number {
      display: block;
      font-size: 60rpx;
      font-weight: bold;
      color: #4A90D9;
      margin-top: 10rpx;
    }
  }
  
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
    }
  }
}

.called-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx 30rpx;
  margin-bottom: 30rpx;
  
  .called-icon {
    font-size: 120rpx;
    animation: shake 0.5s infinite alternate;
  }
  
  .called-text {
    font-size: 36rpx;
    font-weight: bold;
    color: #4A90D9;
    margin-top: 20rpx;
  }
  
  .called-hint {
    font-size: 28rpx;
    color: #999;
    margin-top: 12rpx;
  }
  
  .enter-btn {
    margin-top: 40rpx;
    width: 400rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    color: #fff;
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    border-radius: 44rpx;
    
    &::after { border: none; }
  }
}

@keyframes shake {
  from { transform: rotate(-10deg); }
  to { transform: rotate(10deg); }
}

.tips {
  padding: 24rpx 30rpx;
  background: rgba(74, 144, 217, 0.08);
  border-radius: 12rpx;
  margin-bottom: 30rpx;
  
  .tips-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #4A90D9;
    margin-bottom: 12rpx;
  }
  
  .tips-item {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.8;
  }
}

.bottom-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
  
  .btn-outline {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    font-size: 28rpx;
    color: #4A90D9;
    background: #fff;
    border: 2rpx solid #4A90D9;
    border-radius: 40rpx;
    
    &::after { border: none; }
  }
}
</style>
