<script>
import { connectNotifyWs, closeNotifyWs } from '@/utils/notify-ws.js'
import { getUserInfo, isLoggedIn } from '@/utils/store.js'

export default {
  onLaunch: function () {
    console.log('App Launch')
    // 应用启动时，如果已登录则连接通知 WebSocket
    this.initNotifyWebSocket()
  },
  onShow: function () {
    console.log('App Show')
    // 应用切换到前台时，检查并重连 WebSocket
    this.initNotifyWebSocket()
  },
  onHide: function () {
    console.log('App Hide')
    // 应用切换到后台时，可以选择保持连接（移动端后台通常会自动断开）
  },
  methods: {
    /**
     * 初始化通知 WebSocket 连接
     * 只有已登录用户才连接
     */
    initNotifyWebSocket() {
      if (isLoggedIn()) {
        const userInfo = getUserInfo()
        if (userInfo && userInfo.id) {
          console.log('[App] 用户已登录，连接通知 WebSocket, userId:', userInfo.id)
          connectNotifyWs(userInfo.id)
        }
      }
    }
  },
  // 全局监听登录/登出事件，用于连接/断开 WebSocket
  globalData: {
    // 提供给外部调用的方法
    onLogin: function(userId) {
      console.log('[App] 登录成功，连接通知 WebSocket, userId:', userId)
      connectNotifyWs(userId)
    },
    onLogout: function() {
      console.log('[App] 登出，断开通知 WebSocket')
      closeNotifyWs()
    }
  }
}
</script>

<style>
/*每个页面公共css */
page, :root {
  --primary-color: #0F766E;
  --primary-gradient: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
  --success-color: #10B981;
  --success-gradient: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --warning-color: #EAB308;
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
