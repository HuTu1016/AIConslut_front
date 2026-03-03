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
              <!-- 图片消息 -->
              <image v-if="msg.msgType === 2" class="msg-image" :src="getImageUrl(msg.content)" mode="widthFix" @click="previewImage(msg.content)"></image>
              <!-- 文本消息 -->
              <text v-else class="content">{{ msg.content }}</text>
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
      <text class="end-confirm-sub">如无操作，5分钟后自动结束</text>
      <view class="end-confirm-actions">
        <button class="btn-reject" @click="rejectEnd">继续问诊</button>
        <button class="btn-confirm" @click="confirmEnd">结束问诊</button>
      </view>
    </view>

    <!-- 底部输入 / 非就诊时间提示 / 状态限制 -->
    <view class="time-closed-bar" v-if="!isWithinConsultTime">
      <text class="time-closed-icon">🕐</text>
      <text class="time-closed-text">当前不在就诊时间内，无法发送消息</text>
      <text class="time-closed-range" v-if="scheduleDate">就诊时段：{{ scheduleDate }} {{ scheduleStartTime }} - {{ scheduleEndTime }}</text>
    </view>
    <view class="time-closed-bar" v-else-if="appointmentStatus === 15">
      <text class="time-closed-icon">🔔</text>
      <text class="time-closed-text">已叫号，请点击下方按钮确认前往</text>
      <button class="confirm-call-btn" @click="handleConfirmCall">立即前往</button>
    </view>
    <view class="time-closed-bar" v-else-if="appointmentStatus === 25">
      <text class="time-closed-icon">⏳</text>
      <text class="time-closed-text">等待结束确认中，无法发送消息</text>
    </view>
    <view class="input-area" v-else-if="appointmentStatus === 20">
      <view class="input-actions">
        <view class="action-btn" @click="chooseImage">
          <text class="action-icon">📷</text>
        </view>
      </view>
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
import { apiSendMessage, apiGetMessages, apiMarkMessagesRead, apiGetAppointmentDetail, apiConfirmEndConsult, apiRejectEndConsult, apiConfirmCall, apiUploadConsultImage, BASE_URL } from '@/utils/request.js'

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
      isFirstLoad: true,
      // 排班时间范围（就诊时间窗口）
      scheduleDate: '',
      scheduleStartTime: '',
      scheduleEndTime: '',
      timeCheckTimer: null
    }
  },
  computed: {
    /** 判断当前时间是否在就诊时间段内 */
    isWithinConsultTime() {
      if (!this.scheduleDate || !this.scheduleStartTime || !this.scheduleEndTime) {
        return false
      }
      const now = new Date()
      // 构造就诊时间的开始和结束 Date 对象
      const startStr = `${this.scheduleDate}T${this.scheduleStartTime}`
      const endStr = `${this.scheduleDate}T${this.scheduleEndTime}`
      const start = new Date(startStr)
      const end = new Date(endStr)
      return now >= start && now <= end
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
    // 每分钟刷新时间判断
    this.timeCheckTimer = setInterval(() => { this.$forceUpdate() }, 60000)
  },
  onUnload() {
    this.stopPolling()
    this.stopTimeoutCheck()
    if (this.timeCheckTimer) {
      clearInterval(this.timeCheckTimer)
      this.timeCheckTimer = null
    }
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
          // 排班时间范围
          this.scheduleDate = res.data.scheduleDate || ''
          this.scheduleStartTime = res.data.scheduleStartTime || ''
          this.scheduleEndTime = res.data.scheduleEndTime || ''
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
      // 就诊时间校验（防护）
      if (!this.isWithinConsultTime) {
        uni.showToast({ title: '当前不在就诊时间内', icon: 'none' })
        return
      }
      const content = this.inputText.trim()
      // 状态检查：仅就诊中(20)可发送消息
      if (this.appointmentStatus !== 20) {
        uni.showToast({
          title: '当前状态无法发送消息',
          icon: 'none'
        })
        return
      }
      
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
    },

    /** 患者确认前往（状态15→ 20） */
    async handleConfirmCall() {
      try {
        await apiConfirmCall(this.appointmentId)
        this.appointmentStatus = 20
        uni.showToast({ title: '已进入问诊', icon: 'success' })
      } catch (err) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },

    /** 选择图片发送 */
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadImage(tempFilePath)
        }
      })
    },

    /** 上传图片 */
    async uploadImage(filePath) {
      uni.showLoading({ title: '发送中...' })
      try {
        const res = await apiUploadConsultImage(this.appointmentId, filePath)
        if (res.code === 200 && res.data) {
          // 图片发送成功，添加到本地消息列表
          this.messages.push({
            id: res.data.messageId || Date.now(),
            senderRole: 'USER',
            content: res.data.imageUrl,
            msgType: 2,
            createdAt: new Date().toISOString()
          })
          this.scrollToBottom()
        }
      } catch (err) {
        console.error('图片发送失败:', err)
      } finally {
        uni.hideLoading()
      }
    },

    /** 获取完整图片URL */
    getImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return BASE_URL + url
    },

    /** 预览图片 */
    previewImage(url) {
      const fullUrl = this.getImageUrl(url)
      uni.previewImage({
        urls: [fullUrl],
        current: fullUrl
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

.msg-image {
  max-width: 400rpx;
  min-width: 200rpx;
  border-radius: 12rpx;
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
  
  .input-actions {
    display: flex;
    align-items: center;
    margin-right: 16rpx;
    
    .action-btn {
      width: 70rpx;
      height: 70rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5F7FA;
      border-radius: 50%;
      
      .action-icon {
        font-size: 36rpx;
      }
    }
  }
  
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
    margin-bottom: 8rpx;
  }

  .end-confirm-sub {
    display: block;
    font-size: 24rpx;
    color: #D46B08;
    opacity: 0.7;
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

.time-closed-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(135deg, #FFF1F0, #FFE4E1);
  border-top: 1rpx solid #FFA39E;
  flex-shrink: 0;
  z-index: 10;

  .time-closed-icon {
    font-size: 40rpx;
    margin-bottom: 8rpx;
  }

  .time-closed-text {
    font-size: 28rpx;
    color: #CF1322;
    font-weight: 500;
  }

  .time-closed-range {
    font-size: 24rpx;
    color: #A8071A;
    margin-top: 8rpx;
    opacity: 0.8;
  }

  .confirm-call-btn {
    margin-top: 16rpx;
    width: 280rpx;
    height: 72rpx;
    line-height: 72rpx;
    font-size: 28rpx;
    color: #fff;
    background: linear-gradient(135deg, #52C41A, #73D13D);
    border-radius: 36rpx;
    &::after { border: none; }
  }
}
</style>
