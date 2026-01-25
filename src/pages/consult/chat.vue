<template>
  <view class="chat-container">
    <!-- 顶部信息 -->
    <view class="chat-header">
      <image class="avatar" :src="doctor.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="info">
        <text class="name">{{ doctor.name }}</text>
        <text class="status">{{ doctor.online ? '在线' : '离线' }}</text>
      </view>
      <button class="btn-record" @click="goRecord">病历</button>
    </view>
    
    <!-- 聊天内容 -->
    <scroll-view 
      class="chat-area" 
      scroll-y 
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <view class="message-list">
        <view 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-item"
          :class="msg.senderRole === 'USER' ? 'user-message' : 'doctor-message'"
        >
          <!-- 系统消息 -->
          <view class="system-msg" v-if="msg.senderRole === 'SYSTEM'">
            <text>{{ msg.content }}</text>
          </view>
          
          <!-- 普通消息 -->
          <template v-else>
            <view class="avatar-wrapper" v-if="msg.senderRole === 'DOCTOR'">
              <image class="avatar" :src="doctor.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
            </view>
            
            <view class="bubble">
              <text class="content">{{ msg.content }}</text>
              <text class="time">{{ formatTime(msg.createdAt) }}</text>
            </view>
            
            <view class="avatar-wrapper" v-if="msg.senderRole === 'USER'">
              <image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
            </view>
          </template>
        </view>
      </view>
      
      <view style="height: 120rpx;"></view>
    </scroll-view>
    
    <!-- 底部输入 -->
    <view class="input-area">
      <input 
        class="input-box" 
        type="text" 
        v-model="inputText" 
        placeholder="请输入消息..." 
        confirm-type="send"
        @confirm="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">发送</button>
    </view>
  </view>
</template>

<script>
import { apiSendMessage, apiGetMessages, apiMarkMessagesRead } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: '',
      doctor: {
        id: 1,
        name: '张伟明',
        avatarUrl: '',
        online: true
      },
      messages: [
        {
          id: 1,
          senderRole: 'SYSTEM',
          content: '问诊已开始，请描述您的症状',
          createdAt: '2026-01-25T09:00:00'
        },
        {
          id: 2,
          senderRole: 'USER',
          content: '医生您好，我最近经常头痛，持续一周了',
          createdAt: '2026-01-25T09:05:00'
        },
        {
          id: 3,
          senderRole: 'DOCTOR',
          content: '您好，请问头痛是持续性的还是间歇性的？有其他伴随症状吗？',
          createdAt: '2026-01-25T09:07:00'
        },
        {
          id: 4,
          senderRole: 'USER',
          content: '间歇性的，有时候会恶心',
          createdAt: '2026-01-25T09:10:00'
        },
        {
          id: 5,
          senderRole: 'DOCTOR',
          content: '建议您做个头部CT检查，排除器质性病变。平时注意休息，避免熬夜和过度用眼。',
          createdAt: '2026-01-25T09:15:00'
        }
      ],
      inputText: '',
      scrollTop: 0,
      timer: null
    }
  },
  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
    }
    if (options.doctorId) {
      this.doctor.id = options.doctorId
    }
    if (options.doctorName) {
      this.doctor.name = options.doctorName
    }
    
    this.loadMessages()
    this.startPolling()
  },
  onUnload() {
    this.stopPolling()
  },
  methods: {
    async loadMessages() {
      try {
        // const res = await apiGetMessages({ appointmentId: this.appointmentId })
        // this.messages = res.data.list
        this.scrollToBottom()
        // 标记已读
        // await apiMarkMessagesRead({ appointmentId: this.appointmentId })
      } catch (err) {
        console.error('加载消息失败:', err)
      }
    },
    
    startPolling() {
      // 每5秒轮询新消息
      this.timer = setInterval(() => {
        this.loadMessages()
      }, 5000)
    },
    
    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    async sendMessage() {
      if (!this.inputText.trim()) return
      
      const content = this.inputText.trim()
      this.inputText = ''
      
      // 先添加到本地
      this.messages.push({
        id: Date.now(),
        senderRole: 'USER',
        content: content,
        createdAt: new Date().toISOString()
      })
      this.scrollToBottom()
      
      try {
        await apiSendMessage({
          appointmentId: this.appointmentId,
          content: content
        })
      } catch (err) {
        console.error('发送失败:', err)
        uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },
    
    formatTime(dateStr) {
      const date = new Date(dateStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999
      })
    },
    
    goRecord() {
      uni.navigateTo({
        url: `/pages/consult/record?appointmentId=${this.appointmentId}`
      })
    }
  }
}
</script>

<style lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F7FA;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #f0f0f0;
  }
  
  .info {
    flex: 1;
    margin-left: 20rpx;
    
    .name {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .status {
      display: block;
      font-size: 24rpx;
      color: #6BB392;
      margin-top: 4rpx;
    }
  }
  
  .btn-record {
    height: 56rpx;
    line-height: 56rpx;
    padding: 0 24rpx;
    font-size: 26rpx;
    color: #4A90D9;
    background: rgba(74, 144, 217, 0.1);
    border-radius: 28rpx;
    
    &::after {
      border: none;
    }
  }
}

.chat-area {
  flex: 1;
  padding: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .bubble {
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
      color: #fff;
      border-radius: 20rpx 4rpx 20rpx 20rpx;
      margin-right: 16rpx;
      
      .time {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
  
  &.doctor-message {
    .bubble {
      background: #fff;
      color: #333;
      border-radius: 4rpx 20rpx 20rpx 20rpx;
      margin-left: 16rpx;
      
      .time {
        color: #999;
      }
    }
  }
}

.system-msg {
  width: 100%;
  text-align: center;
  
  text {
    display: inline-block;
    padding: 10rpx 24rpx;
    font-size: 24rpx;
    color: #999;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 20rpx;
  }
}

.avatar-wrapper {
  .avatar {
    width: 70rpx;
    height: 70rpx;
    border-radius: 50%;
    background: #f0f0f0;
  }
}

.bubble {
  max-width: 60%;
  padding: 20rpx 28rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .content {
    font-size: 30rpx;
    line-height: 1.6;
    word-wrap: break-word;
  }
  
  .time {
    display: block;
    font-size: 22rpx;
    margin-top: 10rpx;
    text-align: right;
  }
}

.input-area {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.03);
  
  .input-box {
    flex: 1;
    height: 80rpx;
    background: #F5F7FA;
    border-radius: 40rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    margin-right: 20rpx;
  }
  
  .send-btn {
    width: 140rpx;
    height: 80rpx;
    line-height: 80rpx;
    font-size: 28rpx;
    color: #fff;
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    border-radius: 40rpx;
    padding: 0;
    
    &[disabled] {
      background: #ccc;
    }
    
    &::after {
      border: none;
    }
  }
}
</style>
