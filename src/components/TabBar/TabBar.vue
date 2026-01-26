<template>
  <!-- 底部固定导航栏 -->
  <view class="custom-tab-bar">
    <view 
      class="tab-item" 
      :class="{ active: currentTab === 'message' }" 
      @click="goMessage"
    >
      <view class="icon-box">
        <image class="tab-icon" src="/static/tabbar/消息-copy.png" mode="aspectFit"></image>
      </view>
      <text class="label">消息</text>
    </view>
    
    <view 
      class="tab-item center-item" 
      :class="{ active: currentTab === 'home' }" 
      @click="goHome"
    >
      <view class="icon-circle">
        <image class="center-icon" src="/static/tabbar/首页.png" mode="aspectFit"></image>
      </view>

    </view>
    
    <view 
      class="tab-item" 
      :class="{ active: currentTab === 'profile' }" 
      @click="goProfile"
    >
      <view class="icon-box">
        <image class="tab-icon" src="/static/tabbar/_我的.png" mode="aspectFit"></image>
      </view>
      <text class="label">我的</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    // 当前激活的tab：message | home | profile
    currentTab: {
      type: String,
      default: 'home'
    }
  },
  methods: {
    goMessage() {
      if (this.currentTab === 'message') return
      uni.redirectTo({
        url: '/pages/message/message'
      })
    },
    
    goHome() {
      if (this.currentTab === 'home') return
      uni.redirectTo({
        url: '/pages/index/index'
      })
    },
    
    goProfile() {
      if (this.currentTab === 'profile') return
      uni.redirectTo({
        url: '/pages/profile/profile'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* Custom Tab Bar */
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 110rpx;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 10rpx;
  padding-bottom: calc(10rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(10rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  
  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 120rpx;
    
    .icon-box {
      width: 48rpx;
      height: 48rpx;
      margin-bottom: 4rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .tab-icon {
        width: 48rpx;
        height: 48rpx;
        opacity: 0.6;
      }
    }
    
    .label {
      font-size: 22rpx;
      color: #86909C;
    }
    
    &.active {
      .icon-box .tab-icon {
        opacity: 1;
      }
      .label {
        color: #4B6EF2;
        font-weight: 600;
      }
    }
    
    &.center-item {
      position: relative;
      top: -40rpx;
      
      .icon-circle {
        width: 100rpx;
        height: 100rpx;
        background: linear-gradient(135deg, #4B6EF2 0%, #2D54EA 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(75, 110, 242, 0.4);
        margin-bottom: 8rpx;
        
        .center-icon {
          width: 50rpx;
          height: 50rpx;
          filter: brightness(0) invert(1);
        }
      }
      
      .label {
        font-weight: bold;
        color: #1D2129;
      }
      
      &.active .label {
        color: #4B6EF2;
      }
    }
  }
}
</style>
