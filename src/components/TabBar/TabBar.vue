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
        <!-- 未读消息角标 -->
        <view class="badge" v-if="displayBadge > 0">{{ displayBadge > 99 ? '99+' : displayBadge }}</view>
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
import { apiGetUnreadTotal } from '@/utils/request.js'
import { isLoggedIn } from '@/utils/store.js'

export default {
  name: 'TabBar',
  props: {
    // 当前激活的tab：message | home | profile
    currentTab: {
      type: String,
      default: 'home'
    },
    // 由消息页直接传入的角标数（优先使用）
    messageBadge: {
      type: Number,
      default: -1
    }
  },
  data() {
    return {
      unreadCount: 0
    }
  },
  computed: {
    /** 优先使用父组件传递的角标数，否则使用自身轮询获取的数 */
    displayBadge() {
      if (this.messageBadge >= 0) return this.messageBadge
      return this.unreadCount
    }
  },
  mounted() {
    // 不在消息页时，自行获取未读数
    if (this.messageBadge < 0 && isLoggedIn()) {
      this.fetchUnread()
    }
  },
  methods: {
    async fetchUnread() {
      try {
        const res = await apiGetUnreadTotal()
        if (res.code === 200 && res.data) {
          this.unreadCount = res.data.total || 0
        }
      } catch (e) {
        // 静默失败
      }
    },
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
      position: relative;
      
      .tab-icon {
        width: 48rpx;
        height: 48rpx;
        opacity: 0.6;
      }

      /* 未读角标气泡 */
      .badge {
        position: absolute;
        top: -12rpx;
        right: -20rpx;
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;
        background: #FF4D4F;
        border-radius: 16rpx;
        color: #fff;
        font-size: 20rpx;
        line-height: 32rpx;
        text-align: center;
        box-sizing: border-box;
        border: 2rpx solid #fff;
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
        color: var(--primary-color);
        font-weight: 600;
      }
    }
    
    &.center-item {
      position: relative;
      top: -40rpx;
      
      .icon-circle {
        width: 100rpx;
        height: 100rpx;
        background: var(--primary-gradient);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(15, 118, 110, 0.4);
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
        color: var(--primary-color);
      }
    }
  }
}
</style>
