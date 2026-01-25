<template>
  <view class="login-container">
    <!-- 顶部装饰 -->
    <view class="header-bg"></view>
    
    <!-- Logo区域 -->
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-name">AI智慧问诊</text>
      <text class="app-desc">您的私人健康顾问</text>
    </view>
    
    <!-- 登录区域 -->
    <view class="login-section">
      <view class="feature-list">
        <view class="feature-item">
          <text class="icon">🏥</text>
          <text class="text">在线预约挂号</text>
        </view>
        <view class="feature-item">
          <text class="icon">💬</text>
          <text class="text">专家在线问诊</text>
        </view>
        <view class="feature-item">
          <text class="icon">🤖</text>
          <text class="text">AI智能导诊</text>
        </view>
      </view>
      
      <button 
        class="login-btn" 
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
        :loading="loading"
        :disabled="loading || !agreed"
      >
        <text class="btn-icon">📱</text>
        <text>微信手机号快捷登录</text>
      </button>
      
      <!-- 开发模式快速登录 -->
      <button 
        class="dev-login-btn" 
        @click="handleDevLogin"
        :loading="loading"
        :disabled="loading"
      >
        <text class="btn-icon">🔧</text>
        <text>开发模式快速登录</text>
      </button>
      
      <view class="agreement">
        <checkbox :checked="agreed" @click="agreed = !agreed" />
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @click="showPrivacy">《隐私协议》</text>
          <text class="link" @click="showTerms">《用户协议》</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import { apiLogin, apiGetUserInfo } from '@/utils/request.js'
import { saveLoginInfo } from '@/utils/store.js'

export default {
  data() {
    return {
      loading: false,
      agreed: false
    }
  },
  methods: {
    // 手机号授权登录
    async handleGetPhoneNumber(e) {
      // 用户拒绝授权
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        uni.showToast({
          title: '需要授权手机号才能登录',
          icon: 'none'
        })
        return
      }
      
      // 检查是否同意协议（双重保险）
      if (!this.agreed) {
        uni.showToast({
          title: '请先阅读并同意用户协议',
          icon: 'none'
        })
        return
      }
      
      this.loading = true
      
      try {
        // 获取微信登录code
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          })
        })
        
        // 调用后端登录接口，传递登录code和手机号code
        const res = await apiLogin(loginRes.code, e.detail.code)
        
        // 保存登录信息
        saveLoginInfo(res.data)
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 跳转首页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 1000)
        
      } catch (err) {
        console.error('登录失败:', err)
        uni.showToast({
          title: err.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    showPrivacy() {
      uni.showModal({
        title: '隐私协议',
        content: '我们非常重视您的隐私保护，承诺对您的个人信息进行严格保密...',
        showCancel: false
      })
    },
    
    showTerms() {
      uni.showModal({
        title: '用户协议',
        content: '欢迎使用AI智慧问诊服务，请仔细阅读以下条款...',
        showCancel: false
      })
    },
    
    // 开发模式快速登录（使用固定Mock用户数据）
    async handleDevLogin() {
      this.loading = true
      
      try {
        // 固定的开发测试用户数据
        const mockUserData = {
          token: 'dev_mock_token_' + Date.now(),
          userInfo: {
            id: 1,
            nickname: '测试用户',
            phone: '13800138000',
            avatarUrl: '/static/default-avatar.png'
          }
        }
        
        // 保存登录信息
        saveLoginInfo(mockUserData)
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 跳转首页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 1000)
        
      } catch (err) {
        console.error('登录失败:', err)
        uni.showToast({
          title: '登录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8F4FC 0%, #FFFFFF 100%);
  position: relative;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
  border-radius: 0 0 100rpx 100rpx;
}

.logo-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  
  .logo {
    width: 160rpx;
    height: 160rpx;
    background: #fff;
    border-radius: 40rpx;
    box-shadow: 0 20rpx 60rpx rgba(74, 144, 217, 0.3);
  }
  
  .app-name {
    margin-top: 40rpx;
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
  }
  
  .app-desc {
    margin-top: 16rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-section {
  margin-top: 100rpx;
  padding: 60rpx 50rpx;
  
  .feature-list {
    display: flex;
    justify-content: space-around;
    margin-bottom: 80rpx;
    
    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .icon {
        font-size: 48rpx;
        margin-bottom: 16rpx;
      }
      
      .text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .login-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    box-shadow: 0 12rpx 40rpx rgba(74, 144, 217, 0.4);
    
    &::after {
      border: none;
    }
    
    .btn-icon {
      margin-right: 16rpx;
      font-size: 36rpx;
    }
  }
  
  // 开发模式登录按钮样式
  .dev-login-btn {
    width: 100%;
    height: 96rpx;
    margin-top: 24rpx;
    background: linear-gradient(135deg, #E8A87C 0%, #F4C794 100%);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    box-shadow: 0 12rpx 40rpx rgba(232, 168, 124, 0.4);
    
    &::after {
      border: none;
    }
    
    .btn-icon {
      margin-right: 16rpx;
      font-size: 36rpx;
    }
  }
  
  .agreement {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 40rpx;
    
    .agreement-text {
      font-size: 24rpx;
      color: #999;
      margin-left: 8rpx;
      
      .link {
        color: #4A90D9;
      }
    }
  }
}
</style>
