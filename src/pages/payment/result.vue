<template>
  <view class="result-container">
    <!-- 返回按钮 -->

    
    <view class="result-card" :class="status">
      <text class="icon">{{ status === 'success' ? '✅' : '⏳' }}</text>
      <text class="title">{{ status === 'success' ? '支付成功' : '待支付' }}</text>
      <text class="desc">{{ status === 'success' ? '预约已生效，请按时就诊' : '请尽快完成支付' }}</text>
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
export default {
  data() {
    return {
      status: 'success',
      appointmentId: '',
      ticketNo: 'APT20260125001',
      amount: 50
    }
  },
  onLoad(options) {
    if (options.status) {
      this.status = options.status
    }
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
    }
  },
  methods: {
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
