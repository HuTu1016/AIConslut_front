<template>
  <view class="message-container">
    <!-- 顶部自定义导航栏背景 -->
    <view class="nav-bg"></view>
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 头部标题 -->
      <view class="header-section">
        <text class="page-title">消息</text>
        <view class="header-actions" v-if="totalUnread > 0" @click="markAllRead">
          <text class="mark-all-text">全部已读</text>
        </view>
      </view>
      
      <!-- 统一消息列表 -->
      <view class="session-list">
        <view 
          class="session-item" 
          v-for="(item, index) in displayList" 
          :key="item._key"
          @click="handleItemClick(item)"
          @longpress="handleLongPress(item, index)"
        >
          <!-- 头像区域 -->
          <view class="avatar-box" :class="getAvatarClass(item)">
            <image v-if="item._type === 'DOCTOR'" class="avatar" :src="item.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <image v-else-if="item._type === 'AI'" class="avatar" src="/static/tabbar/ai.png" mode="aspectFill"></image>
            <text v-else class="notify-emoji">{{ getNotifyIcon(item.notifyType) }}</text>
          </view>
          
          <!-- 内容区域 -->
          <view class="content-box">
            <view class="row-top">
              <text class="name">{{ getItemName(item) }}</text>
              <text class="tag" v-if="item._type === 'AI'">智能</text>
              <text class="time">{{ formatTime(item._time) }}</text>
            </view>
            <view class="row-bottom">
              <text class="desc">{{ item._summary }}</text>
            </view>
          </view>

          <!-- 未读角标（列表右上角） -->
          <view class="unread-badge" v-if="item._unread > 0">{{ item._unread > 99 ? '99+' : item._unread }}</view>
          <view class="unread-dot" v-else-if="item._type === 'NOTIFICATION' && item.isRead === 0"></view>        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && displayList.length === 0">
          <text class="empty-icon">💬</text>
          <text class="empty-text">暂无消息</text>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="no-more" v-if="!loading && !hasMore && displayList.length > 0 && notifications.length > 0">
          <text>没有更多了</text>
        </view>
      </view>
      
      <view style="height: 120rpx;"></view>
    </view>
    
    <!-- 长按操作菜单 -->
    <view class="action-mask" v-if="showActionMenu" @click="closeActionMenu">
      <view class="action-menu" :style="{ top: actionMenuTop + 'px' }" @click.stop>
        <view class="action-item delete" @click="confirmDelete">
          <text>删除该聊天</text>
        </view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <TabBar currentTab="message" :messageBadge="totalUnread" />
    
    <!-- 全局悬浮球 -->
    <FloatingAI />
  </view>
</template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue'
import FloatingAI from '@/components/FloatingAI/FloatingAI.vue'
import { 
  apiGetConsultSessions, 
  apiGetNotifications, 
  apiDeleteConsultSession,
  apiDeleteNotification,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  apiGetUnreadTotal
} from '@/utils/request.js'
import { isLoggedIn } from '@/utils/store.js'

export default {
  components: {
    TabBar,
    FloatingAI
  },
  data() {
    return {
      sessions: [],           // 医生会话列表
      notifications: [],      // 系统通知列表
      notifyPage: 1,
      notifySize: 20,
      hasMore: true,
      loading: false,
      totalUnread: 0,         // 全局未读总数

      // 长按菜单
      showActionMenu: false,
      actionMenuTop: 0,
      selectedItem: null,
      selectedIndex: -1
    }
  },
  
  computed: {
    /** 合并所有消息为统一列表，按时间倒序排列 */
    displayList() {
      const list = []

      // 1. AI助手（固定条目）
      list.push({
        _key: 'ai-assistant',
        _type: 'AI',
        _time: null,
        _summary: '24小时在线，随时为您解答健康问题',
        _unread: 0
      })

      // 2. 医生会话
      this.sessions.forEach(s => {
        list.push({
          ...s,
          _key: `doctor-${s.appointmentId}`,
          _type: 'DOCTOR',
          _time: s.lastMessageTime,
          _summary: s.lastMessage || '暂无消息',
          _unread: s.unreadCount || 0
        })
      })

      // 3. 系统通知
      this.notifications.forEach(n => {
        list.push({
          ...n,
          _key: `notify-${n.id}`,
          _type: 'NOTIFICATION',
          _time: n.createdAt,
          _summary: n.content || n.title,
          _unread: 0
        })
      })

      // 按时间倒序排列，AI助手固定在最前面
      list.sort((a, b) => {
        if (a._type === 'AI') return -1
        if (b._type === 'AI') return 1
        const ta = a._time ? new Date(a._time).getTime() : 0
        const tb = b._time ? new Date(b._time).getTime() : 0
        return tb - ta
      })

      return list
    }
  },

  onShow() {
    if (isLoggedIn()) {
      this.loadSessions()
      this.loadNotifications(true)
      this.loadUnreadTotal()
    } else {
      this.sessions = []
      this.notifications = []
      this.totalUnread = 0
    }
  },

  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.notifyPage++
      this.loadNotifications(false)
    }
  },

  methods: {
    /** 加载医生会话 */
    async loadSessions() {
      try {
        const res = await apiGetConsultSessions()
        if (res.data) {
          this.sessions = res.data
        }
      } catch (err) {
        console.error('加载会话失败:', err)
      }
    },

    /** 加载通知列表 */
    async loadNotifications(reset) {
      if (this.loading) return
      if (reset) {
        this.notifyPage = 1
        this.hasMore = true
      }
      if (!this.hasMore) return
      this.loading = true
      try {
        const res = await apiGetNotifications(this.notifyPage, this.notifySize)
        if (res.code === 200) {
          const records = res.data?.records || []
          if (reset) {
            this.notifications = records
          } else {
            this.notifications = [...this.notifications, ...records]
          }
          this.hasMore = records.length >= this.notifySize
        }
      } catch (err) {
        console.error('加载通知失败:', err)
      } finally {
        this.loading = false
      }
    },

    /** 获取统一未读总数 */
    async loadUnreadTotal() {
      try {
        const res = await apiGetUnreadTotal()
        if (res.code === 200 && res.data) {
          this.totalUnread = res.data.total || 0
        }
      } catch (err) {
        console.error('获取未读数失败:', err)
      }
    },

    /** 点击消息项 */
    handleItemClick(item) {
      if (this.showActionMenu) {
        this.closeActionMenu()
        return
      }

      if (item._type === 'AI') {
        uni.navigateTo({ url: '/pages/ai/chat' })
      } else if (item._type === 'DOCTOR') {
        uni.navigateTo({
          url: `/pages/consult/chat?appointmentId=${item.appointmentId}&doctorId=${item.doctorId}&doctorName=${item.doctorName}`
        })
      } else if (item._type === 'NOTIFICATION') {
        // 标记已读
        if (item.isRead === 0) {
          apiMarkNotificationRead(item.id)
          item.isRead = 1
          this.totalUnread = Math.max(0, this.totalUnread - 1)
        }
        // 有跳转链接则跳转
        if (item.jumpUrl) {
          uni.navigateTo({
            url: item.jumpUrl,
            fail: () => uni.showToast({ title: '页面不存在', icon: 'none' })
          })
        }
      }
    },

    /** 长按消息项 */
    handleLongPress(item, index) {
      // AI助手不允许删除
      if (item._type === 'AI') return
      
      this.selectedItem = item
      this.selectedIndex = index
      // 计算弹出位置
      this.actionMenuTop = 200 + index * 80
      this.showActionMenu = true
    },

    closeActionMenu() {
      this.showActionMenu = false
      this.selectedItem = null
      this.selectedIndex = -1
    },

    /** 确认删除 */
    confirmDelete() {
      const item = this.selectedItem
      if (!item) return

      uni.showModal({
        title: '提示',
        content: '确定删除该聊天吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              if (item._type === 'DOCTOR') {
                await apiDeleteConsultSession(item.appointmentId)
                this.sessions = this.sessions.filter(s => s.appointmentId !== item.appointmentId)
              } else if (item._type === 'NOTIFICATION') {
                await apiDeleteNotification(item.id)
                this.notifications = this.notifications.filter(n => n.id !== item.id)
              }
              uni.showToast({ title: '已删除', icon: 'success' })
              this.loadUnreadTotal()
            } catch (err) {
              uni.showToast({ title: '删除失败', icon: 'error' })
            }
          }
        }
      })
      this.closeActionMenu()
    },

    /** 全部标记已读 */
    async markAllRead() {
      try {
        await apiMarkAllNotificationsRead()
        this.notifications.forEach(n => n.isRead = 1)
        this.totalUnread = 0
        uni.showToast({ title: '已全部标记已读', icon: 'success' })
      } catch (err) {
        uni.showToast({ title: '操作失败', icon: 'error' })
      }
    },

    getAvatarClass(item) {
      if (item._type === 'AI') return 'ai-bg'
      if (item._type === 'NOTIFICATION') return 'notify-bg ' + (this.getNotifyColorClass(item.notifyType))
      return ''
    },

    getItemName(item) {
      if (item._type === 'AI') return 'AI健康咨询助手'
      if (item._type === 'DOCTOR') {
        const title = item.doctorTitle ? ` - ${item.doctorTitle}` : ''
        return `${item.doctorName}${title}`
      }
      // 通知类型
      return item.title || '系统通知'
    },

    getNotifyIcon(type) {
      const icons = {
        'APPOINTMENT_SUCCESS': '📅',
        'APPOINTMENT_REMIND': '⏰',
        'CONSULT_REPLY': '💬',
        'SYSTEM_NOTICE': '📢',
        'PAYMENT_SUCCESS': '💳'
      }
      return icons[type] || '📌'
    },

    getNotifyColorClass(type) {
      const classes = {
        'APPOINTMENT_SUCCESS': 'color-blue',
        'APPOINTMENT_REMIND': 'color-orange',
        'CONSULT_REPLY': 'color-green',
        'SYSTEM_NOTICE': 'color-purple',
        'PAYMENT_SUCCESS': 'color-pink'
      }
      return classes[type] || 'color-gray'
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 86400000 && date.getDate() === now.getDate()) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      if (diff < 172800000) return '昨天'
      if (diff < 604800000) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return weekdays[date.getDay()]
      }
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
}
</script>

<style lang="scss">
.message-container {
  min-height: 100vh;
  background-color: #F7F8FA;
  padding-bottom: 20rpx;
  position: relative;
}

.nav-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 320rpx;
  background: var(--primary-gradient);
  border-radius: 0 0 40rpx 40rpx;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  padding: 0 24rpx;
}

/* Header */
.header-section {
  padding-top: 88rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .page-title {
    font-size: 44rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-actions {
    .mark-all-text {
      font-size: 26rpx;
      color: rgba(255,255,255,0.8);
    }
  }
}

/* Session List */
.session-list {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
  
  .session-item {
    display: flex;
    align-items: center;
    padding: 28rpx 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    background: #fff;
    position: relative;
    transition: background 0.2s;
    
    &:active {
      background: #f9f9f9;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .avatar-box {
      position: relative;
      width: 96rpx;
      height: 96rpx;
      margin-right: 24rpx;
      flex-shrink: 0;
      border-radius: 20rpx;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      
      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 20rpx;
      }
      
      .notify-emoji {
        font-size: 44rpx;
      }
      
      &.ai-bg {
        background: linear-gradient(135deg, #0F766E, #2DD4BF);
      }
      
      &.notify-bg {
        &.color-blue { background: linear-gradient(135deg, #14B8A6, #5EEAD4); }
        &.color-orange { background: linear-gradient(135deg, #F59E0B, #FCD34D); }
        &.color-green { background: linear-gradient(135deg, #10B981, #6EE7B7); }
        &.color-purple { background: linear-gradient(135deg, #64748B, #94A3B8); }
        &.color-pink { background: linear-gradient(135deg, #FF2D55, #FF6B8A); }
        &.color-gray { background: linear-gradient(135deg, #8E8E93, #AEAEB2); }
      }
    }
    
    .content-box {
      flex: 1;
      overflow: hidden;
      margin-right: 16rpx;
      
      .row-top {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .name {
          font-size: 32rpx;
          font-weight: 600;
          color: #1D2129;
          flex-shrink: 0;
          max-width: 320rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .tag {
          font-size: 20rpx;
          color: var(--primary-color);
          background: rgba(15, 118, 110, 0.1);
          padding: 2rpx 10rpx;
          border-radius: 6rpx;
          margin-left: 12rpx;
          flex-shrink: 0;
        }
        
        .time {
          font-size: 24rpx;
          color: #C1C5CD;
          margin-left: auto;
          flex-shrink: 0;
        }
      }
      
      .row-bottom {
        .desc {
          font-size: 26rpx;
          color: #86909C;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          line-clamp: 1;
          overflow: hidden;
        }
      }
    }
    
    /* 未读角标 */
    .unread-badge {
      position: absolute;
      top: 16rpx;
      right: 16rpx;
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
      z-index: 2;
    }

    /* 未读小红点（通知类型） */
    .unread-dot {
      position: absolute;
      top: 24rpx;
      right: 24rpx;
      width: 16rpx;
      height: 16rpx;
      background: #FF4D4F;
      border-radius: 50%;
      border: 2rpx solid #fff;
      z-index: 2;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.load-more, .no-more {
  text-align: center;
  padding: 30rpx;
  font-size: 26rpx;
  color: #C1C5CD;
}

/* 长按操作蒙层 */
.action-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
  z-index: 200;
  
  .action-menu {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
    padding: 8rpx 0;
    min-width: 280rpx;
    
    .action-item {
      padding: 24rpx 40rpx;
      text-align: center;
      font-size: 30rpx;
      color: #333;

      &.delete {
        color: #FF4D4F;
      }
      
      &:active {
        background: #f5f5f5;
      }
    }
  }
}
</style>
