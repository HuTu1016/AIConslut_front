<template>
  <view class="waiting-container">
    <!-- 顶部背景 -->
    <view class="top-bg"></view>

    <view class="content-wrapper">
      <!-- 排队号卡片 -->
      <view class="queue-card">
        <view class="queue-header">
          <text class="queue-label">您的排队号</text>
        </view>
        <view class="queue-number">
          <text class="number">{{ queuePosition }}</text>
          <text class="unit">号</text>
        </view>
        <view class="queue-meta">
          <view class="meta-item">
            <text class="meta-value">{{ aheadCount }}</text>
            <text class="meta-label">前面等候</text>
          </view>
          <view class="meta-divider"></view>
          <view class="meta-item">
            <text class="meta-value">{{ estimateWaitText }}</text>
            <text class="meta-label">预计等候</text>
          </view>
          <view class="meta-divider"></view>
          <view class="meta-item">
            <text class="meta-value" :class="statusClass">{{ statusText }}</text>
            <text class="meta-label">当前状态</text>
          </view>
        </view>
      </view>

      <!-- 医生信息 -->
      <view class="info-card">
        <view class="card-title">就诊信息</view>
        <view class="info-row">
          <text class="info-label">医生</text>
          <text class="info-value">{{ doctorName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">科室</text>
          <text class="info-value">{{ departmentName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">预约单号</text>
          <text class="info-value">{{ ticketNo }}</text>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tips-card">
        <text class="tips-title">📌 温馨提示</text>
        <text class="tips-item">1. 请留意排队叫号，医生接诊后会推送通知</text>
        <text class="tips-item">2. 叫号后请在5分钟内进入咨询室</text>
        <text class="tips-item">3. 问诊时段内均可候诊，无需按精确时间到达</text>
      </view>

      <!-- 已接诊提示 -->
      <view class="consult-ready" v-if="appointmentStatus === 20">
        <text class="ready-icon">🔔</text>
        <text class="ready-text">医生已接诊，请进入咨询室</text>
        <button class="ready-btn" @click="goChat">进入咨询室</button>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <button class="btn-back" @click="goHome">返回首页</button>
    </view>
  </view>
</template>

<script>
import { apiGetQueueInfo } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: '',
      queuePosition: 0,
      aheadCount: 0,
      appointmentStatus: 10,
      doctorName: '',
      doctorId: '',
      departmentName: '',
      ticketNo: '',
      pollTimer: null
    }
  },
  computed: {
    estimateWaitText() {
      if (this.appointmentStatus === 20) return '已到号'
      const minutes = this.aheadCount * 10
      if (minutes === 0) return '即将叫号'
      if (minutes < 60) return `约${minutes}分钟`
      return `约${Math.round(minutes / 60)}小时`
    },
    statusText() {
      const map = { 0: '待支付', 10: '候诊中', 20: '已接诊', 25: '问诊中', 30: '已完成', 40: '已取消' }
      return map[this.appointmentStatus] || '候诊中'
    },
    statusClass() {
      if (this.appointmentStatus === 20) return 'status-active'
      if (this.appointmentStatus === 30) return 'status-done'
      return ''
    }
  },
  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
      this.loadQueueInfo()
      this.pollTimer = setInterval(() => this.loadQueueInfo(), 10000)
    }
  },
  onUnload() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },
  methods: {
    async loadQueueInfo() {
      try {
        const res = await apiGetQueueInfo(this.appointmentId)
        if (res.code === 200 && res.data) {
          const d = res.data
          this.queuePosition = d.queuePosition || 0
          this.appointmentStatus = d.status
          this.ticketNo = d.ticketNo || ''
          this.doctorName = d.doctorName || ''
          this.doctorId = d.doctorId || ''
          this.departmentName = d.departmentName || ''
          this.aheadCount = d.aheadCount !== undefined ? d.aheadCount : Math.max(0, this.queuePosition - 1)
        }
      } catch (err) {
        console.error('加载排队信息失败:', err)
      }
    },
    goChat() {
      uni.redirectTo({
        url: `/pages/consult/chat?appointmentId=${this.appointmentId}&doctorId=${this.doctorId}&doctorName=${this.doctorName}`
      })
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
  background: #F7F8FA;
  padding-bottom: 140rpx;
}

.top-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 400rpx;
  background: var(--primary-gradient);
  border-radius: 0 0 60rpx 60rpx;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  padding: 60rpx 30rpx;
}

.queue-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08);
  margin-bottom: 30rpx;

  .queue-header .queue-label {
    font-size: 28rpx;
    color: #86909C;
  }

  .queue-number {
    margin: 20rpx 0 40rpx;
    .number {
      font-size: 120rpx;
      font-weight: bold;
      color: var(--primary-color);
      line-height: 1;
    }
    .unit {
      font-size: 32rpx;
      color: var(--primary-color);
      margin-left: 8rpx;
    }
  }

  .queue-meta {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 30rpx;
    border-top: 1rpx solid #F2F3F5;

    .meta-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      .meta-value {
        font-size: 30rpx;
        font-weight: 600;
        color: #1D2129;
        &.status-active { color: #52C41A; }
        &.status-done { color: var(--primary-color); }
      }
      .meta-label {
        font-size: 24rpx;
        color: #C1C5CD;
        margin-top: 8rpx;
      }
    }
    .meta-divider {
      width: 1rpx;
      height: 60rpx;
      background: #F2F3F5;
    }
  }
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  .card-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D2129;
    margin-bottom: 20rpx;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 14rpx 0;
    .info-label { font-size: 26rpx; color: #86909C; }
    .info-value { font-size: 26rpx; color: #1D2129; }
  }
}

.tips-card {
  background: rgba(15, 118, 110, 0.06);
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
  .tips-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 12rpx;
  }
  .tips-item {
    display: block;
    font-size: 24rpx;
    color: #4E5969;
    line-height: 1.8;
  }
}

.consult-ready {
  background: linear-gradient(135deg, #52C41A, #73D13D);
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  .ready-icon { font-size: 60rpx; display: block; }
  .ready-text {
    display: block;
    font-size: 30rpx;
    color: #fff;
    font-weight: 600;
    margin: 16rpx 0 24rpx;
  }
  .ready-btn {
    background: #fff;
    color: #52C41A;
    font-size: 30rpx;
    font-weight: 600;
    border-radius: 40rpx;
    height: 80rpx;
    line-height: 80rpx;
    &::after { border: none; }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.03);
  .btn-back {
    height: 88rpx;
    line-height: 88rpx;
    font-size: 30rpx;
    color: var(--primary-color);
    background: #fff;
    border: 2rpx solid var(--primary-color);
    border-radius: 44rpx;
    &::after { border: none; }
  }
}
</style>
