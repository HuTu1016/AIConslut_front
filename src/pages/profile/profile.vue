<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="card-bg"></view>
      <view class="user-info">
        <view class="avatar-wrapper" @click="isLoggedIn && goEditProfile()">
          <image 
            class="avatar" 
            :src="$resolveImage(userInfo.avatarUrl)" 
            mode="aspectFill"
          ></image>
        </view>
        <view class="info" v-if="isLoggedIn" @click="goEditProfile">
          <view class="nickname-row">
            <text class="nickname">{{ userInfo.nickname || '未填写昵称' }}</text>
            <view class="completion-tag" v-if="completionRate < 100" @click.stop="goEditProfile">
              完善度{{ completionRate }}% <text class="arrow">›</text>
            </view>
            <view class="completion-tag complete" v-else @click.stop="goEditProfile">
              信息已完善 100% <text class="arrow">›</text>
            </view>
          </view>
          <text class="sub-info" v-if="userInfo.age">{{ userInfo.age }}岁</text>
          <text class="phone">{{ formatPhone(userInfo.phoneEncrypted) }}</text>
        </view>
        <view class="info" v-else @click="goLogin">
          <text class="nickname">点击登录</text>
          <text class="phone">登录后享受更多服务</text>
        </view>
      </view>
    </view>
    
    <!-- 快捷功能 -->
    <view class="quick-stats" v-if="isLoggedIn">
      <view class="stat-item" @click="goAppointments('10')">
        <text class="num">{{ stats.pendingCount }}</text>
        <text class="label">待就诊</text>
      </view>
      <view class="stat-item" @click="goAppointments('30')">
        <text class="num">{{ stats.completedCount }}</text>
        <text class="label">已完成</text>
      </view>
      <view class="stat-item" @click="goMessages">
        <text class="num">{{ stats.unreadCount }}</text>
        <text class="label">未读消息</text>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @click="goAppointments('')">
        <text class="icon">📋</text>
        <text class="label">我的预约</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goRecords">
        <text class="icon">📝</text>
        <text class="label">问诊记录</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goAiHistory">
        <text class="icon">🤖</text>
        <text class="label">AI问诊历史</text>
        <text class="arrow">›</text>
      </view>
    </view>
    

    
    <view class="menu-section">
      <view class="menu-item" @click="showAbout">
        <text class="icon">ℹ️</text>
        <text class="label">关于我们</text>
        <text class="arrow">›</text>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <button class="logout-btn" v-if="isLoggedIn" @click="handleLogout">退出登录</button>
    
    <view style="height: 120rpx;"></view>
    
    <!-- 底部导航栏 -->
    <TabBar currentTab="profile" />
    
    <!-- 全局悬浮球 -->
    <FloatingAI />
  </view>
</template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue'
import FloatingAI from '@/components/FloatingAI/FloatingAI.vue'
import { apiGetUserInfo, apiGetUnreadCount, apiUploadAvatar, apiGetAppointmentStats } from '@/utils/request.js'
import { getUserInfo, isLoggedIn, clearLoginInfo } from '@/utils/store.js'

export default {
  components: {
    TabBar,
    FloatingAI
  },
  data() {
    return {
      isLoggedIn: false,
      userInfo: {},
      stats: {
        pendingCount: 0,
        completedCount: 0,
        unreadCount: 0
      }
    }
  },
  computed: {
    completionRate() {
      if (!this.userInfo || Object.keys(this.userInfo).length === 0) return 0
      
      const fieldsToCheck = [
        'nickname', 'avatarUrl', 'gender', 'realName', 'birthdate', 
        'province', 'height', 'weight', 'bloodType'
      ]
      
      let filledCount = 0
      fieldsToCheck.forEach(field => {
        if (this.userInfo[field]) {
          if (field === 'gender') {
            if (this.userInfo[field] > 0) filledCount++
          } else {
            filledCount++
          }
        }
      })
      
      const arrayFields = ['allergyHistory', 'chronicDisease', 'surgeryHistory', 'lifestyleTags']
      arrayFields.forEach(field => {
          if (this.userInfo[field] && this.userInfo[field] !== '[]') {
              filledCount++
          }
      })
      
      const totalFields = fieldsToCheck.length + arrayFields.length
      return Math.round((filledCount / totalFields) * 100)
    }
  },
  onShow() {
    this.checkLoginStatus()
  },
  methods: {
    checkLoginStatus() {
      this.isLoggedIn = isLoggedIn()
      if (this.isLoggedIn) {
        this.loadUserInfo()
        this.loadStats()
      }
    },
    
    async loadUserInfo() {
      // 先从本地获取
      const localInfo = getUserInfo()
      if (localInfo) {
        this.userInfo = localInfo
      }
      
      // 再从服务器刷新
      try {
        const res = await apiGetUserInfo()
        if (res.data) {
          this.userInfo = res.data
        }
      } catch (err) {
        console.error('获取用户信息失败:', err)
      }
    },
    
    async loadStats() {
      try {
        // 并行请求预约统计和未读消息数
        const [statsRes, unreadRes] = await Promise.all([
          apiGetAppointmentStats().catch(() => null),
          apiGetUnreadCount().catch(() => null)
        ])
        if (statsRes && statsRes.data) {
          this.stats.pendingCount = statsRes.data.pendingCount || 0
          this.stats.completedCount = statsRes.data.completedCount || 0
        }
        if (unreadRes && unreadRes.data) {
          this.stats.unreadCount = unreadRes.data.count || unreadRes.data || 0
        }
      } catch (err) {
        console.error('获取统计数据失败:', err)
      }
    },
    
    goLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      })
    },
    
    goAppointments(status) {
      uni.navigateTo({
        url: `/pages/appointment/list?status=${status}`
      })
    },
    
    goMessages() {
      uni.redirectTo({ url: '/pages/message/message' })
    },
    
    goRecords() {
      uni.navigateTo({ url: '/pages/consult/records' })
    },
    
    goAiHistory() {
      uni.navigateTo({
        url: '/pages/ai/chat'
      })
    },
    
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          uni.showLoading({ title: '上传中...' })
          try {
            const uploadRes = await apiUploadAvatar(tempFilePath)
            if (uploadRes.data && uploadRes.data.avatarUrl) {
              this.userInfo.avatarUrl = uploadRes.data.avatarUrl
              // 更新本地存储的用户信息
              const storedInfo = uni.getStorageSync('userInfo') || {}
              storedInfo.avatarUrl = uploadRes.data.avatarUrl
              uni.setStorageSync('userInfo', storedInfo)
              uni.showToast({ title: '头像更新成功', icon: 'success' })
            } else {
              // 如果后端没有返回头像URL，先用临时路径显示
              this.userInfo.avatarUrl = tempFilePath
              uni.showToast({ title: '头像已更新', icon: 'success' })
            }
          } catch (err) {
            console.error('上传头像失败:', err)
            // 上传失败时仍然使用临时路径显示，体验更好
            this.userInfo.avatarUrl = tempFilePath
          } finally {
            uni.hideLoading()
          }
        }
      })
    },
    
    editProfile() {
      this.goEditProfile()
    },
    
    goEditProfile() {
      if (!this.isLoggedIn) {
        this.goLogin()
        return
      }
      uni.navigateTo({
        url: '/pages/profile/profile-edit'
      })
    },
    

    
    showAbout() {
      uni.showModal({
        title: '关于AI智慧问诊',
        content: '版本: 1.0.0\n\nAI智慧问诊是一款基于人工智能的在线医疗健康服务平台，为您提供便捷的在线问诊、预约挂号等服务。',
        showCancel: false
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            clearLoginInfo()
            this.isLoggedIn = false
            this.userInfo = {}
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          }
        }
      })
    },
    
    formatPhone(phone) {
      if (!phone) return '暂无手机号'
      
      // 清理 ENC_ 前缀（如果有）
      let purePhone = String(phone).replace(/^ENC_/, '')
      
      if (purePhone.length === 11) {
          return purePhone.substring(0, 3) + '*****' + purePhone.substring(8)
      }
      return purePhone
    }
  }
}
</script>

<style lang="scss">
.profile-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 120rpx;
}

.user-card {
  position: relative;
  padding: 60rpx 30rpx 40rpx;
  margin-bottom: 20rpx;
  
  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 260rpx;
    background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
    border-radius: 0 0 50rpx 50rpx;
  }
  
  .user-info {
    position: relative;
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
    
    .avatar-wrapper {
      position: relative;
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      overflow: hidden;
      background: #f0f0f0;
      
      .avatar {
        width: 100%;
        height: 100%;
      }
      
      .upload-tip {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40rpx;
        line-height: 40rpx;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 20rpx;
        text-align: center;
      }
    }
    
    .info {
      margin-left: 30rpx;
      
      .nickname-row {
        display: flex;
        align-items: center;
        margin-bottom: 6rpx;
      }
      
      .nickname {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-right: 16rpx;
      }
      
      .completion-tag {
        display: inline-flex;
        align-items: center;
        padding: 4rpx 12rpx;
        background: rgba(255, 176, 46, 0.1);
        color: #FFB02E;
        font-size: 22rpx;
        border-radius: 20rpx;
        border: 1rpx solid rgba(255, 176, 46, 0.3);
        
        &.complete {
          background: rgba(0, 208, 156, 0.1);
          color: #00D09C;
          border-color: rgba(0, 208, 156, 0.3);
        }
        
        .arrow {
          margin-left: 4rpx;
          font-size: 20rpx;
        }
      }
      
      .sub-info {
        display: block;
        margin-top: 6rpx;
        font-size: 24rpx;
        color: #666;
      }
      
      .phone {
        display: block;
        margin-top: 6rpx;
        font-size: 26rpx;
        color: #999;
      }
    }
  }
}

.quick-stats {
  display: flex;
  justify-content: space-around;
  padding: 30rpx;
  margin: 0 30rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .num {
      font-size: 40rpx;
      font-weight: bold;
      color: #4A90D9;
    }
    
    .label {
      margin-top: 8rpx;
      font-size: 24rpx;
      color: #999;
    }
  }
}

.menu-section {
  margin: 0 30rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .icon {
      font-size: 40rpx;
      margin-right: 20rpx;
    }
    
    .label {
      flex: 1;
      font-size: 30rpx;
      color: #333;
    }
    
    .badge {
      min-width: 36rpx;
      height: 36rpx;
      line-height: 36rpx;
      padding: 0 10rpx;
      background: #f44336;
      color: #fff;
      font-size: 22rpx;
      border-radius: 18rpx;
      text-align: center;
      margin-right: 10rpx;
    }
    
    .arrow {
      font-size: 28rpx;
      color: #ccc;
    }
  }
}

.logout-btn {
  margin: 40rpx 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #E74C3C;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: 2rpx solid #E74C3C;
  
  &::after {
    border: none;
  }
}
</style>
