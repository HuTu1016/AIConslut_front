<template>
  <view class="back-btn" @click="goBack">
    <image src="/static/tabbar/返回.png" class="back-icon" mode="aspectFit"></image>
  </view>
</template>

<script>
export default {
  name: 'BackButton',
  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        // 如果没有上一页，返回首页
        uni.switchTab({
          url: '/pages/index/index'
        });
      }
    }
  }
}
</script>

<style scoped>
.back-btn {
  position: fixed;
  top: 44px;
  left: 16px;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.back-icon {
  width: 40rpx;
  height: 40rpx;
}
</style>
