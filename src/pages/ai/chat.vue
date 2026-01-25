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
          :class="msg.role === 'user' ? 'user-message' : 'ai-message'"
        >
          <!-- 头像 -->
          <view class="avatar" v-if="msg.role === 'ai'">
            <image src="/static/ai-avatar.png" mode="aspectFit" class="avatar-img"></image>
          </view>
          
          <!-- 消息气泡 -->
          <view class="bubble">
            <text class="content">{{ msg.content }}</text>
            <view class="cursor" v-if="msg.role === 'ai' && msg.isTyping"></view>
          </view>
          
          <view class="avatar" v-if="msg.role === 'user'">
            <image src="/static/user-avatar.png" mode="aspectFit" class="avatar-img"></image>
          </view>
        </view>
      </view>
      <!-- 占位，防止底部被输入框遮挡 -->
      <view style="height: 120rpx;"></view>
    </scroll-view>

    <!-- 底部输入区域 -->
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
</template>

<script>
import { BASE_URL } from '@/utils/request.js'

export default {
  data() {
    return {
      messages: [
        {
          role: 'ai',
          content: '你好！我是你的AI医疗助手。请告诉我你不舒服的地方，或者描述你的症状，我会为你提供初步的健康建议。',
          isTyping: false
        }
      ],
      inputText: '',
      isStreaming: false,
      scrollTop: 0,
      baseUrl: BASE_URL + '/api/v1/user/ai/stream'
    };
  },
  methods: {
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

      // 发起流式请求
      this.streamRequest(question, aiMsgIndex);
    },

    streamRequest(question, aiMsgIndex) {
      const _this = this;
      const requestTask = uni.request({
        url: this.baseUrl,
        method: 'GET',
        data: {
          question: question,
          context: this.getContext()
        },
        enableChunked: true, // 开启流式传输
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

      // 监听流式数据
      requestTask.onChunkReceived((res) => {
        const arrayBuffer = res.data;
        const uint8Array = new Uint8Array(arrayBuffer);
        // 简单的UTF-8解码 (for simple cases, TextDecoder recommended for prod)
        let text = '';
        if (typeof TextDecoder !== 'undefined') {
             text = new TextDecoder('utf-8').decode(uint8Array);
        } else {
            // Fallback for environments without TextDecoder
             text = String.fromCharCode.apply(null, uint8Array); 
             // Note: This fallback is imperfect for multi-byte chars split across chunks
        }
        
        // SSE format usually comes as "data: ...\n\n"
        // We need to parse simple raw text if the server sends raw text, 
        // OR parse SSE events if the server sends "data: ..."
        // Based on my backend implementation: emitter.send(text) wraps it in "data:text\n\n"
        
        _this.processSSEChunk(text, aiMsgIndex);
      });
    },
    
    processSSEChunk(text, index) {
       // simple SSE parser
       const lines = text.split('\n');
       for (let line of lines) {
           if (line.startsWith('data:')) {
               const content = line.slice(5); // remove 'data:'
               this.messages[index].content += content;
               this.scrollToBottom();
           }
       }
    },

    getContext() {
      // 简单获取最后几条记录作为上下文
      return this.messages
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
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  background-color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08); /* Avatar shadow */
  
  .avatar-img {
    width: 100%;
    height: 100%;
  }
}

.bubble {
  max-width: 68%; /* Increased width */
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

.input-area {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  
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
