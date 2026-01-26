<template>
  <view class="message-container">
    <!-- 顶部自定义导航栏背景 -->
    <view class="nav-bg"></view>
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 头部标题 -->
      <view class="header-section">
        <text class="page-title">消息</text>
      </view>
      
      <!-- 列表区域 -->
      <view class="session-list">
        
        <!-- AI 助手 (固定) -->
        <view class="session-item" @click="goAiChat">
          <view class="avatar-box">
             <image class="avatar" src="/static/tabbar/ai.png" mode="aspectFill"></image>
          </view>
          <view class="content-box">
            <view class="row-top">
              <text class="name">AI健康咨询助手</text>
              <text class="tag">智能</text>
            </view>
            <view class="row-bottom">
              <text class="desc">24小时在线，随时为您解答健康问题</text>
            </view>
          </view>
          <text class="arrow">›</text>
        </view>
        
        <!-- 医生会话列表 -->
        <view 
          class="session-item" 
          v-for="(session, index) in sessions" 
          :key="index"
          @click="goDoctorChat(session)"
        >
          <view class="avatar-box">
            <image class="avatar" :src="session.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="unread-dot" v-if="session.unreadCount > 0">{{ session.unreadCount > 99 ? '99+' : session.unreadCount }}</view>
          </view>
          
          <view class="content-box">
            <view class="row-top">
              <text class="name">{{ session.doctorName }} 医生</text>
              <text class="time">{{ formatTime(session.lastMessageTime) }}</text>
            </view>
            <view class="row-bottom">
              <text class="desc">{{ session.lastMessage }}</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 (仅当没有医生会话时显示提示，但AI常驻，所以通常不需要完全空状态) -->
        <view class="empty-tip" v-if="sessions.length === 0">
          <text>暂无医生问诊记录</text>
        </view>
        
      </view>
      
      <view style="height: 120rpx;"></view>
    </view>
    
    <!-- 底部导航栏 -->
    <TabBar currentTab="message" />
    
    <!-- 全局悬浮球 -->
    <FloatingAI />
  </view>
</template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue'
import FloatingAI from '@/components/FloatingAI/FloatingAI.vue'
import { apiGetConsultSessions } from '@/utils/request.js'
import { isLoggedIn } from '@/utils/store.js'

export default {
  components: {
    TabBar,
    FloatingAI
  },
  data() {
    return {
      sessions: []
    }
  },
  onShow() {
    if (isLoggedIn()) {
      this.loadSessions()
    } else {
        // 未登录清除列表
        this.sessions = []
    }
  },
  methods: {
    // 加载会话列表
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
    
    // 跳转 AI 问诊
    goAiChat() {
      uni.navigateTo({
        url: '/pages/ai/chat'
      })
    },
    
    // 跳转医生问诊
    goDoctorChat(session) {
      uni.navigateTo({
        url: `/pages/consult/chat?appointmentId=${session.appointmentId}&doctorId=${session.doctorId}&doctorName=${session.doctorName}`
      })
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      // 今天内显示时间
      if (diff < 86400000 && date.getDate() === now.getDate()) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      // 昨天
      if (diff < 172800000) {
        return '昨天'
      }
      // 一周内
      if (diff < 604800000) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return weekdays[date.getDay()]
      }
      // 更早
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
  background: linear-gradient(135deg, #4B6EF2 0%, #2D54EA 100%);
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
  
  .page-title {
    font-size: 44rpx;
    font-weight: bold;
    color: #fff;
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
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    background: #fff;
    transition: background 0.2s;
    
    &:active {
      background: #f9f9f9;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .avatar-box {
      position: relative;
      width: 100rpx;
      height: 100rpx;
      margin-right: 24rpx;
      flex-shrink: 0;
      
      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #f0f0f0;
        border: 2rpx solid #fff;
      }
      
      &.ai-bg {
        background: linear-gradient(135deg, #4B6EF2, #85A5FF);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .emoji {
          font-size: 56rpx;
        }
      }
      
      .unread-dot {
        position: absolute;
        top: -6rpx;
        right: -6rpx;
        min-width: 36rpx;
        height: 36rpx;
        padding: 0 8rpx;
        background: #FF4D4F;
        border-radius: 18rpx;
        color: #fff;
        font-size: 22rpx;
        line-height: 36rpx;
        text-align: center;
        border: 2rpx solid #fff;
        box-sizing: border-box;
      }
    }
    
    .content-box {
      flex: 1;
      overflow: hidden;
      margin-right: 20rpx;
      
      .row-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;
        
        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: #1D2129;
        }
        
        .tag {
          font-size: 20rpx;
          color: #4B6EF2;
          background: rgba(75, 110, 242, 0.1);
          padding: 2rpx 8rpx;
          border-radius: 4rpx;
          margin-left: 12rpx;
        }
        
        .time {
          font-size: 24rpx;
          color: #86909C;
          margin-left: auto;
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
    
    .arrow {
      font-size: 28rpx;
      color: #C9CDD4;
    }
  }
}

.empty-tip {
  padding: 40rpx;
  text-align: center;
  color: #999;
  font-size: 24rpx;
}
</style>
