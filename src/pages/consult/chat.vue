<template>
  <view class="chat-container">
    <!-- 返回按钮 -->

    
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
      :scroll-into-view="scrollIntoViewId"
      :scroll-with-animation="true"
    >
      <view class="message-list">
        <view 
          v-for="(msg, index) in messages" 
          :key="index" 
          :id="'msg-' + msg.id"
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
            
            <!-- 用户自己发的消息，在气泡左侧显示已读状态 -->
            <view class="read-status" v-if="msg.senderRole === 'USER'">
              <text v-if="msg.isRead === 1" class="is-read"><text class="green-dot"></text>已读</text>
              <text v-else class="unread">未读</text>
            </view>
            

          </template>
        </view>
      </view>
      
      <view style="height: 120rpx;"></view>
    </scroll-view>
    
    <!-- 医生请求结束问诊确认条 -->
    <view class="end-confirm-bar" v-if="appointmentStatus === 25">
      <text class="end-confirm-text">👨‍⚕️ 医生请求结束本次问诊</text>
      <view class="end-confirm-actions">
        <button class="btn-reject" @click="rejectEnd">继续问诊</button>
        <button class="btn-confirm" @click="confirmEnd">同意结束</button>
      </view>
    </view>

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
import { apiSendMessage, apiGetMessages, apiMarkMessagesRead, apiGetAppointmentDetail, apiConfirmEndConsult, apiRejectEndConsult } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: '',
      doctor: {
        id: '',
        name: '',
        avatarUrl: '',
        online: true
      },
      messages: [],
      inputText: '',
      scrollTop: 0,
      timer: null,
      timeoutTimer: null,
      // 问诊调度相关
      hasCheckedIn: false,  // 是否已签到
      consultStartTime: null,  // 问诊开始时间
      remainingMinutes: 60,
      showTimeoutWarning: false,
      appointmentStatus: 20,  // 当前预约状态
      scrollIntoViewId: '',
      isFirstLoad: true
    }
  },
  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
    }
    // 从预约详情中获取真实医生信息
    this.loadDoctorInfo()
    this.loadMessages()
    this.startPolling()
    this.startTimeoutCheck()
  },
  onUnload() {
    this.stopPolling()
    this.stopTimeoutCheck()
  },
  methods: {
    async loadDoctorInfo() {
      if (!this.appointmentId) return
      try {
        const res = await apiGetAppointmentDetail(this.appointmentId)
        if (res.code === 200 && res.data) {
          this.doctor.id = res.data.doctorId
          this.doctor.name = res.data.doctorName || '医生'
          this.doctor.avatarUrl = res.data.doctorAvatar || ''
          this.appointmentStatus = res.data.status
        }
      } catch (err) {
        console.error('获取医生信息失败:', err)
      }
    },
    async loadMessages() {
      try {
        const res = await apiGetMessages(this.appointmentId)
        if (res.code === 200 && res.data) {
          this.messages = res.data
          // 检查是否已签到（有USER发的消息）
          if (!this.hasCheckedIn) {
            const userMsg = this.messages.find(m => m.senderRole === 'USER')
            if (userMsg) {
              this.hasCheckedIn = true
            }
          }
          
          if (this.isFirstLoad) {
            this.isFirstLoad = false
            // 定位到第一条发给用户的未读消息处
            const firstUnread = this.messages.find(m => m.isRead === 0 && m.senderRole !== 'USER')
            if (firstUnread) {
              this.$nextTick(() => {
                this.scrollIntoViewId = 'msg-' + firstUnread.id
              })
            } else {
              this.scrollToBottom()
            }
          } else {
            // 如果是轮询或后续发送产生的新消息，滚动到底部
            if (this.messages.length > 0) {
              this.scrollToBottom()
            }
          }
        }
        
        // 标记已读
        await apiMarkMessagesRead(this.appointmentId)
      } catch (err) {
        console.error('加载消息失败:', err)
      }
    },
    
    startPolling() {
      // 每2秒轮询新消息
      this.timer = setInterval(() => {
        this.loadMessages()
      }, 2000)
    },
    
    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    // 启动超时检测
    startTimeoutCheck() {
      this.timeoutTimer = setInterval(() => {
        this.checkTimeout()
      }, 60000) // 每分钟检查一次
    },
    
    stopTimeoutCheck() {
      if (this.timeoutTimer) {
        clearInterval(this.timeoutTimer)
        this.timeoutTimer = null
      }
    },
    
    // 检查问诊是否超时
    checkTimeout() {
      if (this.consultStartTime) {
        const elapsed = Date.now() - new Date(this.consultStartTime).getTime()
        const totalMinutes = 60 // 标准问诊时长
        this.remainingMinutes = totalMinutes - Math.floor(elapsed / 60000)
        
        // 剩余5分钟内发出预警
        if (this.remainingMinutes <= 5 && this.remainingMinutes > 0) {
          this.showTimeoutWarning = true
          uni.showModal({
            title: '问诊时间提醒',
            content: `您的问诊时间还剩${this.remainingMinutes}分钟，请抓紧时间`,
            showCancel: false
          })
        }
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
        
        // 首次发消息 = 签到成功
        if (!this.hasCheckedIn) {
          this.hasCheckedIn = true
          uni.showToast({
            title: '已签到',
            icon: 'success',
            duration: 2000
          })
        }
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
    },

    /** 患者同意结束问诊 */
    async confirmEnd() {
      try {
        await apiConfirmEndConsult(this.appointmentId)
        this.appointmentStatus = 30
        uni.showToast({ title: '问诊已结束', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/appointment/list?status=30' })
        }, 1500)
      } catch (err) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },

    /** 患者拒绝结束，继续问诊 */
    async rejectEnd() {
      try {
        await apiRejectEndConsult(this.appointmentId)
        this.appointmentStatus = 20
        uni.showToast({ title: '已继续问诊', icon: 'success' })
      } catch (err) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
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
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  z-index: 10;
  
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
  height: 0;
  padding: 20rpx;
  box-sizing: border-box;
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
  position: relative;
  
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

.read-status {
  display: flex;
  align-items: flex-end;
  margin-right: 12rpx;
  margin-bottom: 4rpx;
  font-size: 20rpx;
  
  .is-read {
    color: #999;
    display: flex;
    align-items: center;
  }
  
  .green-dot {
    display: inline-block;
    width: 12rpx;
    height: 12rpx;
    background-color: #52C41A;
    border-radius: 50%;
    margin-right: 6rpx;
  }
  
  .unread {
    color: #4A90D9;
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
  flex-shrink: 0;
  z-index: 10;
  
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

.end-confirm-bar {
  background: linear-gradient(135deg, #FFF7E6, #FFF1CC);
  padding: 24rpx 30rpx;
  border-top: 1rpx solid #FFD666;
  flex-shrink: 0;
  z-index: 10;

  .end-confirm-text {
    display: block;
    font-size: 28rpx;
    color: #D46B08;
    font-weight: 500;
    margin-bottom: 16rpx;
  }

  .end-confirm-actions {
    display: flex;
    gap: 20rpx;

    .btn-reject, .btn-confirm {
      flex: 1;
      height: 72rpx;
      line-height: 72rpx;
      font-size: 28rpx;
      border-radius: 36rpx;
      &::after { border: none; }
    }

    .btn-reject {
      color: #D46B08;
      background: #fff;
      border: 2rpx solid #FFD666;
    }

    .btn-confirm {
      color: #fff;
      background: linear-gradient(135deg, #52C41A, #73D13D);
    }
  }
}
</style>
