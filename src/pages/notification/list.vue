<template>
  <view class="notification-container">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="filter-tabs">
        <view class="tab" :class="{ active: currentType === '' }" @click="currentType = ''">全部</view>
        <view class="tab" :class="{ active: currentType === 'APPOINTMENT_SUCCESS' }" @click="currentType = 'APPOINTMENT_SUCCESS'">预约</view>
        <view class="tab" :class="{ active: currentType === 'CONSULT_REPLY' }" @click="currentType = 'CONSULT_REPLY'">问诊</view>
        <view class="tab" :class="{ active: currentType === 'SYSTEM_NOTICE' }" @click="currentType = 'SYSTEM_NOTICE'">系统</view>
      </view>
      <view class="read-all" @click="markAllRead" v-if="unreadCount > 0">
        <text>全部已读</text>
      </view>
    </view>

    <!-- 通知列表 -->
    <scroll-view class="notification-list" scroll-y @scrolltolower="loadMore">
      <view class="notification-item" 
            v-for="item in notifications" 
            :key="item.id"
            :class="{ unread: item.isRead === 0 }"
            @click="handleClick(item)">
        <view class="notify-icon" :class="getIconClass(item.notifyType)">
          <text>{{ getIcon(item.notifyType) }}</text>
        </view>
        <view class="notify-content">
          <view class="notify-header">
            <text class="notify-title">{{ item.title }}</text>
            <text class="notify-time">{{ formatTime(item.createdAt) }}</text>
          </view>
          <text class="notify-body">{{ item.content }}</text>
        </view>
        <view class="unread-dot" v-if="item.isRead === 0"></view>
      </view>

      <view class="empty-state" v-if="!loading && notifications.length === 0">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无通知消息</text>
      </view>

      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>

      <view class="no-more" v-if="!loading && !hasMore && notifications.length > 0">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      notifications: [],
      currentType: '',
      page: 1,
      size: 20,
      hasMore: true,
      loading: false,
      unreadCount: 0
    }
  },

  watch: {
    currentType() {
      this.page = 1
      this.notifications = []
      this.hasMore = true
      this.loadNotifications()
    }
  },

  onShow() {
    this.loadNotifications()
    this.loadUnreadCount()
  },

  methods: {
    async loadNotifications() {
      if (this.loading || !this.hasMore) return
      this.loading = true

      try {
        const params = {
          page: this.page,
          size: this.size
        }
        if (this.currentType) {
          params.notifyType = this.currentType
        }

        const res = await request({
          url: '/api/v1/user/notifications',
          method: 'GET',
          data: params
        })

        if (res.code === 200) {
          const records = res.data.records || []
          if (this.page === 1) {
            this.notifications = records
          } else {
            this.notifications = [...this.notifications, ...records]
          }
          this.hasMore = records.length >= this.size
        }
      } catch (e) {
        console.error('加载通知失败', e)
      } finally {
        this.loading = false
      }
    },

    async loadUnreadCount() {
      try {
        const res = await request({
          url: '/api/v1/user/notifications/unread/count',
          method: 'GET'
        })
        if (res.code === 200) {
          this.unreadCount = res.data || 0
        }
      } catch (e) {
        console.error('加载未读数失败', e)
      }
    },

    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++
        this.loadNotifications()
      }
    },

    async handleClick(item) {
      if (item.isRead === 0) {
        await this.markAsRead(item.id)
        item.isRead = 1
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }

      if (item.jumpUrl) {
        uni.navigateTo({
          url: item.jumpUrl,
          fail: () => {
            uni.showToast({ title: '页面跳转失败', icon: 'none' })
          }
        })
      }
    },

    async markAsRead(id) {
      try {
        await request({
          url: `/api/v1/user/notifications/${id}/read`,
          method: 'POST'
        })
      } catch (e) {
        console.error('标记已读失败', e)
      }
    },

    async markAllRead() {
      try {
        await request({
          url: '/api/v1/user/notifications/read-all',
          method: 'POST'
        })
        this.notifications.forEach(n => n.isRead = 1)
        this.unreadCount = 0
        uni.showToast({ title: '已全部标记已读', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'error' })
      }
    },

    getIcon(type) {
      const icons = {
        'APPOINTMENT_SUCCESS': '📅',
        'APPOINTMENT_REMIND': '⏰',
        'CONSULT_REPLY': '💬',
        'SYSTEM_NOTICE': '📢',
        'PAYMENT_SUCCESS': '💳'
      }
      return icons[type] || '📌'
    },

    getIconClass(type) {
      const classes = {
        'APPOINTMENT_SUCCESS': 'appointment',
        'APPOINTMENT_REMIND': 'remind',
        'CONSULT_REPLY': 'consult',
        'SYSTEM_NOTICE': 'system',
        'PAYMENT_SUCCESS': 'payment'
      }
      return classes[type] || 'default'
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day}`
    }
  }
}
</script>

<style scoped>
.notification-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20rpx 30rpx;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  gap: 24rpx;
}

.tab {
  font-size: 28rpx;
  color: #999;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
}

.tab.active {
  color: #667eea;
  background: #f0f3ff;
  font-weight: bold;
}

.read-all {
  font-size: 26rpx;
  color: #667eea;
}

.notification-list {
  height: calc(100vh - 100rpx);
}

.notification-item {
  display: flex;
  align-items: flex-start;
  background: #fff;
  padding: 30rpx;
  margin-bottom: 2rpx;
  position: relative;
}

.notification-item.unread {
  background: #fafbff;
}

.notify-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.notify-icon.appointment { background: #e3f2fd; }
.notify-icon.remind { background: #fff3e0; }
.notify-icon.consult { background: #e8f5e9; }
.notify-icon.system { background: #f3e5f5; }
.notify-icon.payment { background: #fce4ec; }
.notify-icon.default { background: #f5f5f5; }

.notify-content {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;
}

.notify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.notify-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.notify-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.notify-body {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  width: 16rpx;
  height: 16rpx;
  background: #f44336;
  border-radius: 50%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.load-more, .no-more {
  text-align: center;
  padding: 30rpx;
  font-size: 26rpx;
  color: #999;
}
</style>
