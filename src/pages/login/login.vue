<template>
  <view class="login-container">
    <!-- 返回按钮 -->
    <back-button />
    <!-- 顶部渐变背景 -->
    <view class="header-bg">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-wrapper">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      </view>
      <text class="app-name">AI智慧问诊</text>
      <text class="app-desc">您的私人健康管理专家</text>
    </view>

    <!-- 登录区域 -->
    <view class="login-section">
      <!-- Tab切换 -->
      <view class="login-tabs">
        <view :class="['tab-item', { active: loginMode === 'account' }]" @click="loginMode = 'account'">
          <text>账号登录</text>
        </view>
        <view :class="['tab-item', { active: loginMode === 'wechat' }]" @click="loginMode = 'wechat'">
          <text>微信登录</text>
        </view>
      </view>

      <!-- 账号密码登录表单 -->
      <view v-if="loginMode === 'account'" class="account-form">
        <view class="form-item">
          <text class="form-icon">👤</text>
          <input class="form-input" v-model="username" placeholder="请输入用户名" type="text" />
        </view>
        <view class="form-item">
          <text class="form-icon">🔒</text>
          <input class="form-input" v-model="password" placeholder="请输入密码" :password="!showPwd" type="text" />
          <text class="toggle-pwd" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁' }}</text>
        </view>
        <button class="login-btn account-btn" @click="handleAccountLogin" :loading="loading" :disabled="loading || !agreed">
          <text class="btn-text">登 录</text>
        </button>
      </view>

      <!-- 微信登录 -->
      <view v-else class="wechat-section">
        <button 
          class="login-btn wechat-btn" 
          open-type="getPhoneNumber"
          @getphonenumber="handleGetPhoneNumber"
          :loading="loading"
          :disabled="loading || !agreed"
        >
          <view class="btn-content">
            <image class="wechat-icon" src="/static/wechat-icon.png" mode="aspectFit" 
              @error="wechatIconError = true" v-if="!wechatIconError"></image>
            <text class="btn-icon" v-else>📱</text>
            <text class="btn-text">微信手机号快捷登录</text>
          </view>
        </button>
      </view>

      <view class="agreement" @click="agreed = !agreed">
        <view :class="['checkbox-custom', { checked: agreed }]">
          <text class="check-mark" v-if="agreed">✓</text>
        </view>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @click.stop="showPrivacy">《隐私协议》</text>
          <text class="link" @click.stop="showTerms">《用户协议》</text>
        </text>
      </view>
    </view>

    <!-- 底部装饰 -->
    <view class="footer">
      <text class="footer-text">安全 · 便捷 · 专业</text>
    </view>
  </view>
</template>

<script>
import { apiLogin, apiGetUserInfo } from '@/utils/request.js'
import { apiAccountLogin } from '@/utils/request.js'
import { saveLoginInfo } from '@/utils/store.js'
import { connectNotifyWs } from '@/utils/notify-ws.js'

export default {
  data() {
    return {
      loading: false,
      agreed: false,
      wechatIconError: false,
      loginMode: 'account',
      username: '',
      password: '',
      showPwd: false
    }
  },
  methods: {
    // 账号密码登录
    async handleAccountLogin() {
      if (!this.agreed) {
        uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
        return
      }
      if (!this.username.trim() || !this.password.trim()) {
        uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
        return
      }
      this.loading = true
      try {
        const res = await apiAccountLogin(this.username.trim(), this.password.trim())
        saveLoginInfo(res.data)
        if (res.data?.userInfo?.id) {
          connectNotifyWs(res.data.userInfo.id)
        }
        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' })
        }, 1000)
      } catch (err) {
        console.error('登录失败:', err)
      } finally {
        this.loading = false
      }
    },

    // 微信手机号授权登录
    async handleGetPhoneNumber(e) {
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
        return
      }
      if (!this.agreed) {
        uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
        return
      }
      this.loading = true
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({ provider: 'weixin', success: resolve, fail: reject })
        })
        const res = await apiLogin(loginRes.code, e.detail.code)
        saveLoginInfo(res.data)
        if (res.data?.userInfo?.id) {
          connectNotifyWs(res.data.userInfo.id)
        }
        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' })
        }, 1000)
      } catch (err) {
        console.error('登录失败:', err)
        uni.showToast({ title: err.message || '登录失败', icon: 'none' })
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
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: #F0F4F8;
  position: relative;
  overflow: hidden;
}

/* 顶部渐变背景 */
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600rpx;
  background: linear-gradient(145deg, #0B3D6B 0%, #0F5C8E 40%, #1A8A7D 100%);
  border-radius: 0 0 60rpx 60rpx;
  overflow: hidden;

  .bg-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    background: #fff;
  }

  .circle-1 {
    width: 300rpx;
    height: 300rpx;
    top: -60rpx;
    right: -40rpx;
  }

  .circle-2 {
    width: 200rpx;
    height: 200rpx;
    top: 200rpx;
    left: -60rpx;
  }
}

/* Logo区域 */
.logo-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;

  .logo-wrapper {
    width: 140rpx;
    height: 140rpx;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 1rpx solid rgba(255, 255, 255, 0.2);
  }

  .logo {
    width: 100rpx;
    height: 100rpx;
  }

  .app-name {
    margin-top: 24rpx;
    font-size: 44rpx;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 4rpx;
  }

  .app-desc {
    margin-top: 8rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 2rpx;
  }
}

/* 登录区域 */
.login-section {
  margin-top: 140rpx;
  padding: 0 50rpx;
}

/* Tab切换 */
.login-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
  gap: 60rpx;

  .tab-item {
    padding: 10rpx 0;
    font-size: 30rpx;
    color: #8A96A5;
    border-bottom: 4rpx solid transparent;
    transition: all 0.3s;

    &.active {
      color: #0F5C8E;
      font-weight: 600;
      border-bottom-color: #1A8A7D;
    }
  }
}

/* 账号登录表单 */
.account-form {
  .form-item {
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border-radius: 24rpx;
    padding: 0 24rpx;
    margin-bottom: 24rpx;
    height: 96rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

    .form-icon {
      font-size: 36rpx;
      margin-right: 16rpx;
    }

    .form-input {
      flex: 1;
      font-size: 28rpx;
      color: #303133;
    }

    .toggle-pwd {
      font-size: 36rpx;
      padding: 10rpx;
    }
  }

  .account-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #0F5C8E 0%, #1A8A7D 100%);
    border-radius: 48rpx;
    border: none;
    box-shadow: 0 12rpx 36rpx rgba(26, 138, 125, 0.35);
    margin-top: 16rpx;

    &::after {
      border: none;
    }

    &[disabled] {
      opacity: 0.6;
    }

    .btn-text {
      color: #FFFFFF;
      font-size: 32rpx;
      font-weight: 600;
      letter-spacing: 8rpx;
    }
  }

  .register-link {
    display: flex;
    justify-content: center;
    margin-top: 24rpx;
    font-size: 24rpx;
    color: #8A96A5;

    .link {
      color: #0F5C8E;
      margin-left: 8rpx;
      font-weight: 500;
    }
  }
}

/* 微信登录 */
.wechat-section {
  .wechat-btn {
    width: 100%;
    height: 100rpx;
    background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    box-shadow: 0 12rpx 36rpx rgba(7, 193, 96, 0.35);

    &::after {
      border: none;
    }

    &[disabled] {
      opacity: 0.6;
      background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wechat-icon {
      width: 44rpx;
      height: 44rpx;
      margin-right: 16rpx;
    }

    .btn-icon {
      margin-right: 16rpx;
      font-size: 36rpx;
    }

    .btn-text {
      color: #FFFFFF;
      font-size: 32rpx;
      font-weight: 600;
      letter-spacing: 2rpx;
    }
  }
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36rpx;
  padding: 10rpx 0;

  .checkbox-custom {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #C0C8D0;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10rpx;
    transition: all 0.2s;

    &.checked {
      background: #1A8A7D;
      border-color: #1A8A7D;
    }

    .check-mark {
      color: #fff;
      font-size: 20rpx;
      font-weight: bold;
    }
  }

  .agreement-text {
    font-size: 22rpx;
    color: #8A96A5;

    .link {
      color: #0F5C8E;
    }
  }
}

/* 底部 */
.footer {
  position: fixed;
  bottom: 60rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;

  .footer-text {
    font-size: 22rpx;
    color: #B0BCC8;
    letter-spacing: 8rpx;
  }
}
</style>
