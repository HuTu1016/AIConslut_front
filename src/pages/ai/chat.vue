<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="title">AI 医疗助手</view>
      <view class="subtitle">24小时智能问诊服务</view>
    </view>

    <!-- 聊天内容区域 -->
    <scroll-view 
      class="chat-area" 
      scroll-y="true" 
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <view class="message-list">
        <view 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-item"
          :class="[msg.role === 'user' ? 'user-message' : 'ai-message', msg.role === 'system' ? 'system-message' : '']"
        >
          <!-- 系统消息（档案同步提示） -->
          <view v-if="msg.role === 'system'" class="system-bubble">
            <text class="system-content">{{ msg.content }}</text>
          </view>
          
          <!-- 正常消息 -->
          <template v-else>
            <!-- AI头像 -->
            <view class="avatar" v-if="msg.role === 'ai'">
              <image src="/static/ai-avatar.png" mode="aspectFit" class="avatar-img"></image>
            </view>
            
            <!-- 消息气泡 -->
            <view class="bubble">
              <text class="content">{{ msg.content }}</text>
              <view class="cursor" v-if="msg.role === 'ai' && msg.isTyping"></view>
            </view>
            
            <!-- 用户头像 -->
            <view class="avatar" v-if="msg.role === 'user'">
              <image src="/static/user-avatar.png" mode="aspectFit" class="avatar-img"></image>
            </view>
          </template>
        </view>
      </view>
      <!-- 占位，防止底部被输入框遮挡 -->
      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- 底部工具栏和输入区域 -->
    <view class="bottom-area">
      <!-- 功能工具栏 -->
      <view class="toolbar">
        <view class="tool-item" @click="syncProfile" :class="{ active: profileSynced }">
          <text class="tool-icon">📋</text>
          <text class="tool-text">{{ profileSynced ? '已同步' : '发送档案' }}</text>
        </view>
        <view class="tool-item" @click="uploadImage">
          <text class="tool-icon">📷</text>
          <text class="tool-text">上传图片</text>
        </view>
        <view class="tool-item" @click="toggleHistory">
          <text class="tool-icon">📊</text>
          <text class="tool-text">{{ includeHistory ? '对比开启' : '历史对比' }}</text>
          <view v-if="includeHistory" class="active-dot"></view>
        </view>
      </view>
      
      <!-- 输入区域 -->
      <view class="input-area">
        <input 
          class="input-box" 
          type="text" 
          v-model="inputText" 
          placeholder="请描述您的症状或问题..." 
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button 
          class="send-btn" 
          :class="{ 'disabled': !inputText.trim() || isStreaming }"
          @click="sendMessage"
          :disabled="!inputText.trim() || isStreaming"
        >
          发送
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/utils/request.js'

export default {
  data() {
    return {
      messages: [
        {
          role: 'ai',
          content: '你好！我是你的AI医疗助手。\n\n💡 提示：点击下方"发送档案"可以让我更好地了解您的健康状况，提供更个性化的建议。\n\n请告诉我您哪里不舒服,或者描述您的症状。',
          isTyping: false
        }
      ],
      inputText: '',
      isStreaming: false,
      scrollTop: 0,
      profileSynced: false,      // 档案是否已同步
      includeHistory: false,     // 是否开启历史对比
      baseUrl: BASE_URL + '/api/v1/user/ai',
    };
  },
  methods: {
    /**
     * 同步个人档案
     */
    syncProfile() {
      if (this.profileSynced) {
        uni.showToast({ title: '档案已同步', icon: 'none' });
        return;
      }
      
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '同步中...' });
      
      const _this = this;
      uni.request({
        url: this.baseUrl + '/sync-profile',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          uni.hideLoading();
          if (res && res.statusCode === 200 && res.data && res.data.code === 200) {
            _this.profileSynced = true;
            _this.messages.push({
              role: 'system',
              content: '✅ 已同步个人健康档案，AI将结合您的病史、过敏史等信息进行分析'
            });
            _this.scrollToBottom();
            uni.showToast({ title: '同步成功', icon: 'success' });
          } else {
            uni.showToast({ title: res?.data?.message || '同步失败', icon: 'none' });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error('同步档案失败', err);
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    
    /**
     * 上传图片分析（体检报告/药品）
     */
    uploadImage() {
      const _this = this;
      const token = uni.getStorageSync('token');
      
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (chooseRes) => {
          const tempFilePath = chooseRes.tempFilePaths[0];
          
          // 添加用户消息显示图片
          _this.messages.push({
            role: 'user',
            content: '📷 [上传图片分析]'
          });
          
          // 添加AI占位
          const aiMsgIndex = _this.messages.push({
            role: 'ai',
            content: '',
            isTyping: true
          }) - 1;
          
          _this.isStreaming = true;
          _this.scrollToBottom();
          
          // 上传并分析
          uni.uploadFile({
            url: _this.baseUrl + '/analyze-image',
            filePath: tempFilePath,
            name: 'file',
            header: { 'Authorization': `Bearer ${token}` },
            success: (uploadRes) => {
              console.log('图片分析完成', uploadRes);
              
              // uploadFile返回的是完整响应，需要解析SSE格式数据
              if (uploadRes.statusCode === 200 && uploadRes.data) {
                const responseText = _this.parseSSEResponse(uploadRes.data);
                _this.messages[aiMsgIndex].content = responseText;
              } else {
                _this.messages[aiMsgIndex].content = '图片分析失败，请重试';
              }
              
              _this.messages[aiMsgIndex].isTyping = false;
              _this.isStreaming = false;
              _this.scrollToBottom();
            },
            fail: (err) => {
              console.error('上传失败', err);
              _this.messages[aiMsgIndex].content = '图片分析失败，请重试';
              _this.messages[aiMsgIndex].isTyping = false;
              _this.isStreaming = false;
            }
          });
        }
      });
    },
    
    /**
     * 解析SSE格式响应数据
     * 输入: "data:很\n\ndata:抱歉\n\n..."
     * 输出: "很抱歉..."
     */
    parseSSEResponse(sseData) {
      if (!sseData || typeof sseData !== 'string') {
        return '解析响应失败';
      }
      
      let result = '';
      const lines = sseData.split('\n');
      for (let line of lines) {
        if (line && line.startsWith('data:')) {
          result += line.slice(5);
        }
      }
      return result || sseData;
    },
    
    /**
     * 切换历史对比模式
     */
    toggleHistory() {
      this.includeHistory = !this.includeHistory;
      const status = this.includeHistory ? '开启' : '关闭';
      uni.showToast({ 
        title: `历史对比已${status}`, 
        icon: 'none' 
      });
      
      if (this.includeHistory) {
        this.messages.push({
          role: 'system',
          content: '📊 已开启历史对比模式，AI将对比您的历次问诊记录分析病情变化'
        });
        this.scrollToBottom();
      }
    },
    
    /**
     * 发送消息
     */
    sendMessage() {
      if (!this.inputText.trim() || this.isStreaming) return;

      const question = this.inputText.trim();
      
      // 添加用户消息
      this.messages.push({
        role: 'user',
        content: question
      });
      this.inputText = '';
      this.scrollToBottom();

      // 添加AI占位消息
      const aiMsgIndex = this.messages.push({
        role: 'ai',
        content: '',
        isTyping: true
      }) - 1;
      
      this.isStreaming = true;
      this.scrollToBottom();

      // 根据是否同步档案选择不同接口
      if (this.profileSynced) {
        this.streamConsultRequest(question, aiMsgIndex);
      } else {
        this.streamRequest(question, aiMsgIndex);
      }
    },

    /**
     * 普通流式请求（兼容旧接口）
     */
    streamRequest(question, aiMsgIndex) {
      const _this = this;
      const token = uni.getStorageSync('token');
      
      const requestTask = uni.request({
        url: this.baseUrl + '/stream',
        method: 'GET',
        data: {
          question: question,
          context: this.getContext()
        },
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        enableChunked: true,
        success: (res) => {
          console.log('Stream finished', res);
          this.messages[aiMsgIndex].isTyping = false;
          this.isStreaming = false;
        },
        fail: (err) => {
          console.error('Request failed', err);
          this.messages[aiMsgIndex].content += '\n[网络请求失败]';
          this.messages[aiMsgIndex].isTyping = false;
          this.isStreaming = false;
        }
      });

      requestTask.onChunkReceived((res) => {
        _this.processSSEChunk(res.data, aiMsgIndex);
      });
    },
    
    /**
     * 带档案的智能问诊流式请求
     */
    streamConsultRequest(question, aiMsgIndex) {
      const _this = this;
      const token = uni.getStorageSync('token');
      
      // 构建请求体
      const requestBody = {
        question: question,
        context: this.getContext(),
        includeProfile: this.profileSynced,
        includeHistory: this.includeHistory
      };
      
      const requestTask = uni.request({
        url: this.baseUrl + '/consult',
        method: 'POST',
        data: requestBody,
        header: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        enableChunked: true,
        success: (res) => {
          console.log('Consult stream finished', res);
          this.messages[aiMsgIndex].isTyping = false;
          this.isStreaming = false;
        },
        fail: (err) => {
          console.error('Consult request failed', err);
          this.messages[aiMsgIndex].content += '\n[网络请求失败]';
          this.messages[aiMsgIndex].isTyping = false;
          this.isStreaming = false;
        }
      });

      requestTask.onChunkReceived((res) => {
        _this.processSSEChunk(res.data, aiMsgIndex);
      });
    },
    
    /**
     * 处理SSE流式数据
     */
    processSSEChunk(data, index) {
      let text = '';
      
      // 处理不同类型的数据
      if (data instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(data);
        if (typeof TextDecoder !== 'undefined') {
          text = new TextDecoder('utf-8').decode(uint8Array);
        } else {
          text = String.fromCharCode.apply(null, uint8Array);
        }
      } else if (typeof data === 'string') {
        text = data;
      } else {
        // 其他类型，尝试转换
        try {
          text = String(data);
        } catch (e) {
          console.warn('无法解析SSE数据', data);
          return;
        }
      }
      
      // 确保text是字符串且不为空
      if (!text || typeof text !== 'string') {
        return;
      }
      
      const lines = text.split('\n');
      for (let line of lines) {
        if (line && line.startsWith('data:')) {
          const content = line.slice(5);
          this.messages[index].content += content;
          this.scrollToBottom();
        }
      }
    },

    /**
     * 获取对话上下文
     */
    getContext() {
      return this.messages
        .filter(m => m.role !== 'system')
        .slice(-5)
        .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
        .join('\n');
    },

    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
    }
  }
};
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F7F8FA;
}

.header {
  height: 88rpx;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 10;
  
  .title {
    font-size: 34rpx;
    font-weight: bold;
    color: #1D2129;
  }
  
  .subtitle {
    font-size: 22rpx;
    color: #86909C;
    margin-top: 4rpx;
  }
}

.chat-area {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
}

.message-item {
  display: flex;
  margin-bottom: 40rpx;
  align-items: flex-start;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .bubble {
      background: linear-gradient(135deg, #4B6EF2 0%, #2D54EA 100%);
      color: #fff;
      border-radius: 20rpx 4rpx 20rpx 20rpx;
      margin-right: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(75, 110, 242, 0.2);
    }
  }
  
  &.ai-message {
    flex-direction: row;
    
    .bubble {
      background-color: #ffffff;
      color: #1D2129;
      border-radius: 4rpx 20rpx 20rpx 20rpx;
      margin-left: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    }
  }
  
  &.system-message {
    justify-content: center;
  }
}

.system-bubble {
  background-color: rgba(75, 110, 242, 0.1);
  padding: 16rpx 32rpx;
  border-radius: 30rpx;
  
  .system-content {
    font-size: 24rpx;
    color: #4B6EF2;
  }
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  background-color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  
  .avatar-img {
    width: 100%;
    height: 100%;
  }
}

.bubble {
  max-width: 68%;
  padding: 24rpx 32rpx;
  font-size: 30rpx;
  line-height: 1.6;
  position: relative;
  word-wrap: break-word;
}

.cursor {
  display: inline-block;
  width: 4rpx;
  height: 32rpx;
  background-color: #1D2129;
  margin-left: 8rpx;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.bottom-area {
  background-color: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.toolbar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 30rpx 10rpx;
  border-bottom: 1rpx solid #F2F3F5;
  
  .tool-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10rpx 20rpx;
    border-radius: 16rpx;
    position: relative;
    
    &.active {
      background-color: rgba(75, 110, 242, 0.1);
      
      .tool-text {
        color: #4B6EF2;
      }
    }
    
    .tool-icon {
      font-size: 36rpx;
      margin-bottom: 6rpx;
    }
    
    .tool-text {
      font-size: 22rpx;
      color: #86909C;
    }
    
    .active-dot {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 12rpx;
      height: 12rpx;
      background-color: #4B6EF2;
      border-radius: 50%;
    }
  }
}

.input-area {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  
  .input-box {
    flex: 1;
    height: 80rpx;
    background-color: #F2F3F5;
    border-radius: 40rpx;
    padding: 0 32rpx;
    font-size: 28rpx;
    margin-right: 20rpx;
    color: #1D2129;
  }
  
  .send-btn {
    width: 140rpx;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: linear-gradient(135deg, #4B6EF2 0%, #2D54EA 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 500;
    border-radius: 40rpx;
    padding: 0;
    box-shadow: 0 4rpx 12rpx rgba(75, 110, 242, 0.3);
    
    &.disabled {
      background: #C9CDD4;
      box-shadow: none;
      color: #fff;
    }
    
    &::after {
      border: none;
    }
  }
}
</style>
