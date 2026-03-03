<template>
  <view class="history-container">
    <!-- 搜索框 -->
    <view class="search-bar">
      <input 
        type="text" 
        v-model="searchKeyword" 
        placeholder="搜索历史对话..." 
        class="search-input"
        @input="onSearchInput"
      />
    </view>
    
    <!-- 新建对话按钮 -->
    <view class="new-chat-btn" @click="createNewSession">
      <text class="new-chat-icon">+</text>
      <text class="new-chat-text">新建对话</text>
    </view>
    
    <!-- 会话列表 -->
    <scroll-view scroll-y class="session-list">
      <view v-if="filteredSessions.length === 0" class="empty-tip">
        <text class="empty-icon">💬</text>
        <text class="empty-text">暂无历史对话</text>
      </view>
      <view 
        v-for="session in filteredSessions" 
        :key="session.id" 
        class="session-item"
        @click="goToChat(session)"
        @longpress="onSessionLongPress"
      >
        <view class="session-info">
          <text class="session-title">{{ session.title || '新对话' }}</text>
          <text class="session-time">{{ formatTime(session.updatedAt) }}</text>
        </view>
        <!-- 删除模式显示删除按钮 -->
        <view v-if="deleteMode" class="delete-btn" @click.stop="deleteSession(session.id)">
          <text class="delete-icon">🗑️</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { apiGetAiSessions, apiCreateAiSession, apiSearchAiSessions, apiDeleteAiSession } from '@/utils/request.js'

export default {
  data() {
    return {
      searchKeyword: '',
      sessions: [],
      deleteMode: false,
      searchTimer: null
    }
  },
  computed: {
    /** 过滤后的会话列表 */
    filteredSessions() {
      if (!this.searchKeyword.trim()) {
        return this.sessions
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.sessions.filter(s => 
        s.title && s.title.toLowerCase().includes(keyword)
      )
    }
  },
  onShow() {
    this.loadSessions()
  },
  methods: {
    /** 加载会话列表 */
    async loadSessions() {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await apiGetAiSessions()
        if (res.data) {
          this.sessions = res.data
        }
      } catch (err) {
        console.error('加载会话列表失败', err)
      } finally {
        uni.hideLoading()
      }
    },
    
    /** 创建新会话并跳转到聊天页 */
    async createNewSession() {
      try {
        uni.showLoading({ title: '创建中...' })
        const res = await apiCreateAiSession()
        uni.hideLoading()
        if (res.data) {
          // 保存会话ID后跳转到聊天页
          uni.setStorageSync('lastAiSessionId', res.data.id)
          uni.navigateTo({
            url: '/pages/ai/chat'
          })
        }
      } catch (err) {
        uni.hideLoading()
        console.error('创建会话失败', err)
        uni.showToast({ title: '创建失败', icon: 'none' })
      }
    },
    
    /** 点击会话，跳转到聊天页加载该会话 */
    goToChat(session) {
      if (this.deleteMode) return
      // 保存选中的会话ID，chat.vue 的 onShow 会自动恢复
      uni.setStorageSync('lastAiSessionId', session.id)
      uni.navigateTo({
        url: '/pages/ai/chat'
      })
    },
    
    /** 长按进入/退出删除模式 */
    onSessionLongPress() {
      this.deleteMode = !this.deleteMode
      uni.showToast({ 
        title: this.deleteMode ? '已进入删除模式' : '已退出删除模式', 
        icon: 'none' 
      })
    },
    
    /** 删除会话 */
    async deleteSession(sessionId) {
      try {
        await apiDeleteAiSession(sessionId)
        this.sessions = this.sessions.filter(s => s.id !== sessionId)
        uni.showToast({ title: '删除成功', icon: 'success' })
      } catch (err) {
        console.error('删除会话失败', err)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
    
    /** 搜索防抖 */
    onSearchInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.searchSessions()
      }, 300)
    },
    
    /** 搜索会话 */
    async searchSessions() {
      if (!this.searchKeyword.trim()) {
        this.loadSessions()
        return
      }
      try {
        const res = await apiSearchAiSessions(this.searchKeyword)
        if (res.data) {
          this.sessions = res.data
        }
      } catch (err) {
        console.error('搜索会话失败', err)
      }
    },
    
    /** 格式化时间 */
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      
      // 今天内
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      // 一周内
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return days[date.getDay()]
      }
      // 更早
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
}
</script>

<style lang="scss">
.history-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F7F8FA;
  box-sizing: border-box;
}

/* 搜索框 */
.search-bar {
  padding: 20rpx 30rpx;
  
  .search-input {
    height: 72rpx;
    background-color: #F2F3F5;
    border-radius: 36rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }
}

/* 新建对话按钮 */
.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10rpx 30rpx 20rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(15, 118, 110, 0.3);
  
  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
  
  .new-chat-icon {
    font-size: 38rpx;
    margin-right: 12rpx;
    font-weight: bold;
  }
}

/* 会话列表 */
.session-list {
  flex: 1;
  padding: 0 30rpx;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #86909C;
  }
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: background-color 0.2s;
  
  &:active {
    background-color: rgba(15, 118, 110, 0.06);
  }
  
  .session-info {
    flex: 1;
    overflow: hidden;
    
    .session-title {
      display: block;
      font-size: 30rpx;
      color: #1D2129;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .session-time {
      display: block;
      font-size: 24rpx;
      color: #86909C;
      margin-top: 8rpx;
    }
  }
  
  .session-badge {
    font-size: 24rpx;
    color: #0F766E;
    background-color: rgba(15, 118, 110, 0.1);
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    margin-left: 16rpx;
    flex-shrink: 0;
  }
  
  .delete-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 16rpx;
    flex-shrink: 0;
    
    .delete-icon {
      font-size: 36rpx;
    }
  }
}
</style>
