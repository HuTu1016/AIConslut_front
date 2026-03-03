<script>
import { connectNotifyWs, closeNotifyWs, isWsConnected } from '@/utils/notify-ws.js'
import { getUserInfo, isLoggedIn } from '@/utils/store.js'

// 防抖标记，避免 onLaunch 和 onShow 同时触发导致重复连接
let wsInitialized = false

export default {
  onLaunch: function () {
    console.log('App Launch')
    // 应用启动时，如果已登录则连接通知 WebSocket
    this.initNotifyWebSocket()
  },
  onShow: function () {
    console.log('App Show')
    // 应用从后台切换到前台时，延迟检查并重连 WebSocket（避免与 onLaunch 冲突）
    setTimeout(() => {
      if (!isWsConnected()) {
        wsInitialized = false
        this.initNotifyWebSocket()
      }
    }, 1000)
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    /**
     * 初始化通知 WebSocket 连接
     * 只有已登录用户才连接，且防止重复初始化
     */
    initNotifyWebSocket() {
      if (wsInitialized) {
        console.log('[App] WebSocket 已初始化，跳过')
        return
      }
      if (isLoggedIn()) {
        const userInfo = getUserInfo()
        if (userInfo && userInfo.id) {
          wsInitialized = true
          console.log('[App] 用户已登录，连接通知 WebSocket, userId:', userInfo.id)
          connectNotifyWs(userInfo.id)
        }
      }
    }
  },
  globalData: {
    onLogin: function(userId) {
      wsInitialized = true
      console.log('[App] 登录成功，连接通知 WebSocket, userId:', userId)
      connectNotifyWs(userId)
    },
    onLogout: function() {
      wsInitialized = false
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
