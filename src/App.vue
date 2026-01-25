<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/*每个页面公共css */
:root {
  --primary-color: #4B6EF2;
  --primary-gradient: linear-gradient(135deg, #4B6EF2 0%, #2D54EA 100%);
  --success-color: #00D09C;
  --success-gradient: linear-gradient(135deg, #00D09C 0%, #00B386 100%);
  --warning-color: #FFB02E;
  --text-main: #1D2129;
  --text-regular: #4E5969;
  --text-secondary: #86909C;
  --bg-page: #F7F8FA;
  --bg-card: #FFFFFF;
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

body {
  background-color: var(--bg-page);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

view, text, image, scroll-view, swiper, button {
  box-sizing: border-box;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}
</style>
