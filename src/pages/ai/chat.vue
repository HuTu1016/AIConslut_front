<template>
  <view class="container">
    <!-- 侧边栏遮罩层 -->
    <view 
      class="drawer-mask" 
      v-if="drawerVisible" 
      @click="closeDrawer"
    />
    
    <!-- 侧边栏 -->
    <view class="drawer-sidebar" :class="{ visible: drawerVisible }">
      <!-- 搜索框 -->
      <view class="drawer-search">
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
      
      <!-- 对话列表 -->
      <scroll-view scroll-y class="session-list">
        <view v-if="filteredSessions.length === 0" class="empty-tip">
          <text>暂无历史对话</text>
        </view>
        <view 
          v-for="(session, index) in filteredSessions" 
          :key="session.id" 
          class="session-item"
          :class="{ active: session.id === currentSessionId }"
          @click="onSessionClick(index)"
          @longpress="onSessionLongPress"
        >
          <view class="session-info">
            <text class="session-title">{{ session.title || '新对话' }}</text>
            <text class="session-time">{{ formatTime(session.updatedAt) }}</text>
          </view>
          <!-- 删除模式时显示垃圾桶图标 -->
          <view v-if="deleteMode" class="delete-btn" @click.stop="deleteSession(session.id)">
            <text class="delete-icon">🗑️</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="menu-btn" @click="openDrawer">
        <text class="menu-icon">☰</text>
      </view>
      <view class="header-center">
        <view class="title">AI 医疗助手</view>
        <view class="subtitle">24小时智能问诊服务</view>
      </view>
      <view class="header-right" />
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
            <!-- 消息气泡 -->
            <view class="bubble">
              <!-- 图片列表（如果有） -->
              <view class="msg-images" v-if="msg.images && msg.images.length > 0">
                <image 
                  v-for="(img, imgIdx) in msg.images" 
                  :key="imgIdx" 
                  :src="img" 
                  mode="aspectFill" 
                  class="msg-img"
                  @click="previewImage(img, msg.images)"
                ></image>
              </view>
              <!-- 文字内容：用户消息纯文本，AI消息Markdown格式化 -->
              <text class="content" v-if="msg.content && msg.role === 'user'">{{ msg.content }}</text>
              <rich-text class="content ai-content" v-if="msg.content && msg.role !== 'user'" :nodes="renderMarkdown(msg.content)"></rich-text>
              <view class="cursor" v-if="msg.role === 'ai' && msg.isTyping"></view>
            </view>
          </template>
        </view>
      </view>
    </scroll-view>

    <!-- 功能面板遮罩 -->
    <view class="panel-mask" v-if="showFunctionPanel" @click="closeFunctionPanel"></view>
    
    <!-- 功能面板 -->
    <view class="function-panel" :class="{ visible: showFunctionPanel }">
      <!-- 已选择的图片/文件预览 -->
      <view class="selected-preview" v-if="selectedImages.length > 0 || selectedFile">
        <view class="preview-scroll">
          <view class="preview-item" v-for="(img, idx) in selectedImages" :key="idx">
            <image :src="img" mode="aspectFill" class="preview-img"></image>
            <view class="preview-remove" @click="removeSelectedImage(idx)">×</view>
          </view>
          <view class="preview-item file-item" v-if="selectedFile">
            <text class="file-icon">📄</text>
            <text class="file-name">{{ selectedFile.name }}</text>
            <view class="preview-remove" @click="removeSelectedFile">×</view>
          </view>
        </view>
      </view>
      
      <!-- 功能按钮行 -->
      <view class="function-buttons">
        <view class="func-btn" @click="takePhoto">
          <view class="func-icon-wrap"><text class="func-icon">📷</text></view>
          <text class="func-text">相机</text>
        </view>
        <view class="func-btn" @click="chooseImage">
          <view class="func-icon-wrap"><text class="func-icon">🖼️</text></view>
          <text class="func-text">相册</text>
        </view>
        <view class="func-btn" @click="chooseFile">
          <view class="func-icon-wrap"><text class="func-icon">📁</text></view>
          <text class="func-text">文件</text>
        </view>

      </view>
    </view>

    <!-- 底部输入区域 -->
    <view class="bottom-area">
      <view class="input-row">
        <!-- + 按钮 -->
        <view class="plus-btn" @click="toggleFunctionPanel">
          <text class="plus-icon">{{ showFunctionPanel ? '×' : '+' }}</text>
        </view>
        
        <!-- 输入框 -->
        <input 
          class="input-box" 
          type="text" 
          v-model="inputText" 
          :placeholder="inputPlaceholder"
          confirm-type="send"
          @confirm="sendMessage"
        />
        
        <!-- 发送按钮 -->
        <view 
          class="send-btn" 
          :class="{ disabled: !canSend }"
          @click="sendMessage"
        >
          <text class="send-icon">➤</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL, apiGetAiSessions, apiCreateAiSession, apiSearchAiSessions, apiGetAiSessionDetail, apiDeleteAiSession } from '@/utils/request.js'

export default {
  data() {
    return {
      // 侧边栏相关
      drawerVisible: false,
      searchKeyword: '',
      sessions: [],
      currentSessionId: null,
      deleteMode: false,  // 删除模式
      
      // 聊天相关
      messages: [
        {
          role: 'ai',
          content: '你好！我是你的AI医疗助手。\n\n请告诉我您哪里不舒服，或者描述您的症状。',
          isTyping: false
        }
      ],
      inputText: '',
      isStreaming: false,
      scrollTop: 0,

      baseUrl: BASE_URL + '/api/v1/user/ai',
      
      // 功能面板相关
      showFunctionPanel: false,
      selectedImages: [],  // 已选择的图片路径列表
      selectedFile: null,  // 已选择的文件 { name, path, size }
      
      // 搜索防抖
      searchTimer: null,
    };
  },
  computed: {
    /**
     * 过滤后的会话列表
     */
    filteredSessions() {
      if (!this.searchKeyword.trim()) {
        return this.sessions;
      }
      const keyword = this.searchKeyword.toLowerCase();
      return this.sessions.filter(s => 
        s.title && s.title.toLowerCase().includes(keyword)
      );
    },
    
    /**
     * 是否可以发送
     */
    canSend() {
      if (this.isStreaming) return false;
      return this.inputText.trim() || this.selectedImages.length > 0 || this.selectedFile;
    },
    
    /**
     * 输入框占位符
     */
    inputPlaceholder() {
      if (this.selectedImages.length > 0) {
        return '添加描述（可选）...';
      }
      if (this.selectedFile) {
        return '添加描述（可选）...';
      }
      return '请描述您的症状或问题...';
    }
  },
  async onShow() {
    // 页面显示时加载会话列表
    await this.loadSessions();
    // 恢复上次会话（如果当前有会话ID则重新加载历史）
    await this.restoreLastSession();
  },
  onHide() {
    // 页面隐藏时保存当前会话ID
    this.saveCurrentSession();
  },
  methods: {
    /**
     * 打开侧边栏
     */
    openDrawer() {
      this.drawerVisible = true;
      this.loadSessions();
    },
    
    /**
     * 关闭侧边栏
     */
    closeDrawer() {
      this.drawerVisible = false;
      this.deleteMode = false;  // 退出删除模式
    },
    
    /**
     * 保存当前会话ID到本地存储
     */
    saveCurrentSession() {
      if (this.currentSessionId) {
        uni.setStorageSync('lastAiSessionId', this.currentSessionId);
      }
    },
    
    /**
     * 恢复上次会话
     */
    async restoreLastSession() {
      const lastSessionId = uni.getStorageSync('lastAiSessionId');
      if (lastSessionId) {
        // 查找会话
        const session = this.sessions.find(s => s.id === lastSessionId);
        if (session) {
          this.currentSessionId = lastSessionId;
          // 重新加载历史（即使当前已有消息，也刷新以获取最新记录）
          await this.loadSessionHistory(session.id, session.title);
        }
      }
    },
    
    /**
     * 加载会话列表
     */
    async loadSessions() {
      try {
        const res = await apiGetAiSessions();
        if (res.data) {
          this.sessions = res.data;
        }
      } catch (err) {
        console.error('加载会话列表失败', err);
      }
    },
    
    /**
     * 创建新会话
     */
    async createNewSession() {
      try {
        const res = await apiCreateAiSession();
        if (res.data) {
          this.currentSessionId = res.data.id;
          // 清空当前对话
          this.messages = [
            {
              role: 'ai',
              content: '你好！我是你的AI医疗助手。\n\n请告诉我您哪里不舒服，或者描述您的症状。',
              isTyping: false
            }
          ];

          this.includeHistory = false;
          this.closeDrawer();
          // 刷新列表
          this.loadSessions();
          uni.showToast({ title: '已创建新对话', icon: 'success' });
        }
      } catch (err) {
        console.error('创建会话失败', err);
        uni.showToast({ title: '创建失败', icon: 'none' });
      }
    },
    
    /**
     * 会话点击事件处理（通过索引）
     */
    onSessionClick(index) {
      // 删除模式下点击不切换会话
      if (this.deleteMode) return;
      
      const session = this.filteredSessions[index];
      if (session) {
        this.switchSession(session);
      }
    },
    
    /**
     * 长按会话触发删除模式
     */
    onSessionLongPress() {
      this.deleteMode = !this.deleteMode;
      if (this.deleteMode) {
        uni.showToast({ title: '已进入删除模式', icon: 'none' });
      } else {
        uni.showToast({ title: '已退出删除模式', icon: 'none' });
      }
    },
    
    /**
     * 删除会话
     */
    async deleteSession(sessionId) {
      try {
        await apiDeleteAiSession(sessionId);
        // 从列表中移除
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        uni.showToast({ title: '删除成功', icon: 'success' });
        // 如果删除的是当前会话，清空聊天区域
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = null;
          this.messages = [
            {
              role: 'ai',
              content: '你好！我是你的AI医疗助手。\n\n请告诉我您哪里不舒服，或者描述您的症状。',
              isTyping: false
            }
          ];
        }
      } catch (err) {
        console.error('删除会话失败', err);
        uni.showToast({ title: '删除失败', icon: 'none' });
      }
    },
    
    /**
     * 切换会话
     */
    switchSession(session) {
      this.currentSessionId = session.id;
      this.saveCurrentSession();  // 切换时立即保存
      this.closeDrawer();
      // 从服务器加载历史消息
      this.loadSessionHistory(session.id, session.title);
    },
    
    /**
     * 加载会话历史消息
     */
    async loadSessionHistory(sessionId, title) {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await apiGetAiSessionDetail(sessionId);
        uni.hideLoading();
        
        if (res.data && res.data.messages && res.data.messages.length > 0) {
          // 有历史消息，显示历史
          this.messages = res.data.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'ai',
            content: m.content,
            isTyping: false
          }));
        } else {
          // 无历史消息，显示欢迎语
          this.messages = [
            {
              role: 'ai',
              content: `已切换到会话：${title || '新对话'}\n\n请继续您的问诊。`,
              isTyping: false
            }
          ];
        }
        this.scrollToBottom();
        uni.showToast({ title: '已切换对话', icon: 'none' });
      } catch (err) {
        uni.hideLoading();
        console.error('加载历史消息失败', err);
        // 加载失败时显示默认提示
        this.messages = [
          {
            role: 'ai',
            content: `已切换到会话：${title || '新对话'}\n\n请继续您的问诊。`,
            isTyping: false
          }
        ];
        uni.showToast({ title: '已切换对话', icon: 'none' });
      }
    },
    
    /**
     * 滚动到聊天区域底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        // 设置一个足够大的值让它滚动到底部
        this.scrollTop = this.scrollTop === 99999 ? 99998 : 99999;
      });
    },
    
    /**
     * 搜索输入防抖
     */
    onSearchInput() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(() => {
        this.searchSessions();
      }, 300);
    },
    
    /**
     * 搜索会话
     */
    async searchSessions() {
      if (!this.searchKeyword.trim()) {
        this.loadSessions();
        return;
      }
      try {
        const res = await apiSearchAiSessions(this.searchKeyword);
        if (res.data) {
          this.sessions = res.data;
        }
      } catch (err) {
        console.error('搜索会话失败', err);
      }
    },
    
    /**
     * 格式化时间
     */
    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now - date;
      
      // 今天内
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      // 一周内
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
      }
      // 更早
      return `${date.getMonth() + 1}/${date.getDate()}`;
    },
    

    
    /**
     * 切换功能面板显示
     */
    toggleFunctionPanel() {
      this.showFunctionPanel = !this.showFunctionPanel;
    },
    
    /**
     * 关闭功能面板
     */
    closeFunctionPanel() {
      this.showFunctionPanel = false;
    },
    
    /**
     * 拍照
     */
    takePhoto() {
      const _this = this;
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        success: (res) => {
          _this.selectedImages.push(res.tempFilePaths[0]);
          // 保持面板展开显示预览
        }
      });
    },
    
    /**
     * 从相册选择图片
     */
    chooseImage() {
      const _this = this;
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          _this.selectedImages = [..._this.selectedImages, ...res.tempFilePaths];
          // 保持面板展开显示预览
        }
      });
    },
    
    /**
     * 选择文件
     */
    chooseFile() {
      const _this = this;
      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res) => {
          if (res.tempFiles && res.tempFiles.length > 0) {
            const file = res.tempFiles[0];
            _this.selectedFile = {
              name: file.name,
              path: file.path,
              size: file.size
            };
            // 保持面板展开显示预览
          }
        }
      });
      // #endif
      // #ifndef MP-WEIXIN
      uni.showToast({ title: '暂不支持', icon: 'none' });
      // #endif
    },
    
    /**
     * 移除已选择的图片
     */
    removeSelectedImage(index) {
      this.selectedImages.splice(index, 1);
    },
    
    /**
     * 移除已选择的文件
     */
    removeSelectedFile() {
      this.selectedFile = null;
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
     * 发送消息（支持图片和文件）
     */
    sendMessage() {
      if (!this.canSend || this.isStreaming) return;

      // 如果有选中的图片，调用图片分析
      if (this.selectedImages.length > 0) {
        this.sendImageMessage();
        return;
      }
      
      // 如果有选中的文件，显示提示（后端暂不支持）
      if (this.selectedFile) {
        uni.showToast({ title: '文件分析功能开发中', icon: 'none' });
        return;
      }

      const question = this.inputText.trim();
      if (!question) return;
      
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

      // 始终使用 consult 接口以关联会话
      this.streamConsultRequest(question, aiMsgIndex);
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
      
      // 构建请求体，加入 sessionId
      const requestBody = {
        sessionId: this.currentSessionId,
        question: question,
        context: this.getContext()
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
          // 刷新会话列表
          this.loadSessions();
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
        try {
          text = String(data);
        } catch (e) {
          console.warn('无法解析SSE数据', data);
          return;
        }
      }
      
      if (!text || typeof text !== 'string') {
        return;
      }
      
      // 按SSE事件边界分割（空行分隔不同事件）
      // SSE规范：同一事件内多个data:行用\n连接还原换行
      const events = text.split(/\n\n/);
      for (let event of events) {
        if (!event.trim()) continue;
        const dataLines = [];
        const eventLines = event.split('\n');
        for (let line of eventLines) {
          line = line.replace(/\r$/, '');
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5));
          }
        }
        if (dataLines.length > 0) {
          const content = dataLines.join('\n');
          this.messages[index].content += content;
        }
      }
      this.scrollToBottom();
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
    
    /**
     * 发送图片消息
     */
    sendImageMessage() {
      const _this = this;
      const token = uni.getStorageSync('token');
      
      // 保存图片列表用于显示
      const imagesToSend = [...this.selectedImages];
      const userContent = this.inputText.trim() || '请帮我分析这张图片';
      
      // 显示用户发送的图片消息（存储图片路径）
      this.messages.push({
        role: 'user',
        content: userContent,
        images: imagesToSend  // 存储图片列表
      });
      
      // 添加AI回复占位
      this.messages.push({
        role: 'ai',
        content: '',
        isTyping: true
      });
      const aiMsgIndex = this.messages.length - 1;
      
      // 取第一张图片
      const imagePath = imagesToSend[0];
      
      // 清空选择
      this.inputText = '';
      this.selectedImages = [];
      this.closeFunctionPanel();
      this.scrollToBottom();
      this.isStreaming = true;
      
      // 上传图片并分析（使用正确的接口地址）
      uni.uploadFile({
        url: this.baseUrl + '/analyze-image',
        filePath: imagePath,
        name: 'file',
        formData: {
          question: userContent
        },
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          console.log('图片分析响应:', res);
          if (res.statusCode === 200) {
            // SSE 流式响应，解析内容
            const content = _this.parseSSEResponse(res.data) || '分析完成';
            // 模拟打字效果
            _this.typeWriterEffect(aiMsgIndex, content);
          } else {
            _this.messages[aiMsgIndex].content = '请求失败，请重试';
            _this.messages[aiMsgIndex].isTyping = false;
            _this.isStreaming = false;
          }
        },
        fail: (err) => {
          console.error('上传失败', err);
          _this.messages[aiMsgIndex].content = '图片上传失败，请重试';
          _this.messages[aiMsgIndex].isTyping = false;
          _this.isStreaming = false;
        }
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
    },
    
    /**
     * 模拟打字效果
     */
    typeWriterEffect(msgIndex, fullText) {
      const _this = this;
      let index = 0;
      const speed = 30; // 每个字符的间隔(毫秒)
      
      this.messages[msgIndex].content = '';
      
      const timer = setInterval(() => {
        if (index < fullText.length) {
          _this.messages[msgIndex].content += fullText.charAt(index);
          index++;
          if (index % 10 === 0) {
            _this.scrollToBottom();
          }
        } else {
          clearInterval(timer);
          _this.messages[msgIndex].isTyping = false;
          _this.isStreaming = false;
          _this.scrollToBottom();
        }
      }, speed);
    },
    
    /**
     * 预览图片
     */
    previewImage(current, urls) {
      uni.previewImage({
        current: current,
        urls: urls || [current]
      });
    },
    
    /**
     * 将Markdown文本转换为HTML（轻量级，适配rich-text组件）
     * 支持：换行、标题、加粗、斜体、无序/有序列表、行内代码
     */
    renderMarkdown(text) {
      if (!text) return '';
      
      // 按行处理
      const lines = text.split('\n');
      let html = '';
      let inList = false; // 是否在列表中
      let listType = ''; // ul 或 ol
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 标题：### / ## / #
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          if (inList) { html += `</${listType}>`; inList = false; }
          const level = headingMatch[1].length;
          const sizes = { 1: '36rpx', 2: '32rpx', 3: '30rpx' };
          html += `<p style="font-size:${sizes[level]};font-weight:bold;margin:16rpx 0 8rpx;color:#1D2129;">${this.renderInline(headingMatch[2])}</p>`;
          continue;
        }
        
        // 无序列表：- 或 * 开头
        const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
        if (ulMatch) {
          if (!inList || listType !== 'ul') {
            if (inList) html += `</${listType}>`;
            inList = true;
            listType = 'ul';
          }
          html += `<p style="margin:4rpx 0;padding-left:24rpx;">• ${this.renderInline(ulMatch[1])}</p>`;
          continue;
        }
        
        // 有序列表：1. 2. 等
        const olMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
        if (olMatch) {
          if (!inList || listType !== 'ol') {
            if (inList) html += `</${listType}>`;
            inList = true;
            listType = 'ol';
          }
          html += `<p style="margin:4rpx 0;padding-left:24rpx;">${olMatch[1]}. ${this.renderInline(olMatch[2])}</p>`;
          continue;
        }
        
        // 非列表行，关闭列表
        if (inList) { html += `</${listType}>`; inList = false; }
        
        // 空行 → 段落间距
        if (line.trim() === '') {
          html += '<p style="margin:12rpx 0;"></p>';
          continue;
        }
        
        // 普通段落
        html += `<p style="margin:4rpx 0;">${this.renderInline(line)}</p>`;
      }
      
      if (inList) html += `</${listType}>`;
      return html;
    },
    
    /**
     * 处理行内Markdown语法（加粗、斜体、行内代码）
     */
    renderInline(text) {
      if (!text) return '';
      return text
        // 行内代码
        .replace(/`([^`]+)`/g, '<span style="background-color:#F2F3F5;padding:2rpx 8rpx;border-radius:4rpx;font-size:26rpx;">$1</span>')
        // 加粗
        .replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:bold;">$1</span>')
        // 斜体
        .replace(/\*(.+?)\*/g, '<span style="font-style:italic;">$1</span>');
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
  position: relative;
}

/* 侧边栏遮罩 */
.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 侧边栏 */
.drawer-sidebar {
  position: fixed;
  top: 0;
  left: -70%;
  width: 70%;
  height: 100vh;
  background-color: #ffffff;
  z-index: 101;
  display: flex;
  flex-direction: column;
  transition: left 0.3s ease;
  box-shadow: 2rpx 0 20rpx rgba(0, 0, 0, 0.1);
  
  &.visible {
    left: 0;
  }
  
  .drawer-search {
    padding: 40rpx 30rpx 20rpx;
    border-bottom: 1rpx solid #F2F3F5;
    
    .search-input {
      height: 72rpx;
      background-color: #F2F3F5;
      border-radius: 36rpx;
      padding: 0 30rpx;
      font-size: 28rpx;
    }
  }
  
  .new-chat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20rpx 30rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    
    .new-chat-icon {
      font-size: 36rpx;
      margin-right: 10rpx;
    }
  }
  
  .session-list {
    flex: 1;
    padding: 0 20rpx;
    
    .empty-tip {
      text-align: center;
      padding: 60rpx 0;
      color: #86909C;
      font-size: 28rpx;
    }
    
    .session-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 20rpx;
      margin-bottom: 10rpx;
      border-radius: 16rpx;
      transition: background-color 0.2s;
      
      &:active, &.active {
        background-color: rgba(15, 118, 110, 0.1);
      }
      
      .session-info {
        flex: 1;
        overflow: hidden;
        
        .session-title {
          display: block;
          font-size: 28rpx;
          color: #1D2129;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .session-time {
          display: block;
          font-size: 22rpx;
          color: #86909C;
          margin-top: 6rpx;
        }
      }
      
      .session-badge {
        font-size: 22rpx;
        color: #86909C;
        background-color: #F2F3F5;
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
        margin-left: 10rpx;
      }
      
      .delete-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 10rpx;
        
        .delete-icon {
          font-size: 36rpx;
        }
      }
    }
  }
}

/* 顶部导航栏 - 固定定位 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 50;
  
  .menu-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .menu-icon {
      font-size: 40rpx;
      color: #1D2129;
    }
  }
  
  .header-center {
    flex: 1;
    text-align: center;
    
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
  
  .header-right {
    width: 80rpx;
  }
}

/* 聊天区域 - 适配固定定位 */
.chat-area {
  position: fixed;
  top: 100rpx;
  left: 0;
  right: 0;
  bottom: 280rpx;
  padding: 30rpx;
  box-sizing: border-box;
  background-color: #F7F8FA;
}

.message-item {
  display: flex;
  margin-bottom: 40rpx;
  align-items: flex-start;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .bubble {
      background: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
      color: #fff;
      border-radius: 20rpx 4rpx 20rpx 20rpx;
      margin-right: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(15, 118, 110, 0.2);
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
  background-color: rgba(15, 118, 110, 0.1);
  padding: 16rpx 32rpx;
  border-radius: 30rpx;
  
  .system-content {
    font-size: 24rpx;
    color: var(--primary-color);
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

/* AI消息Markdown格式化样式 */
.ai-content {
  font-size: 28rpx;
  line-height: 1.7;
  color: #1D2129;
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

/* 消息中的图片列表 */
.msg-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
  
  .msg-img {
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    object-fit: cover;
  }
}

/* 底部区域 - 固定定位 */
.bottom-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  z-index: 50;
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
      background-color: rgba(15, 118, 110, 0.1);
      
      .tool-text {
        color: var(--primary-color);
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
      background-color: var(--primary-color);
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
    background: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 500;
    border-radius: 40rpx;
    padding: 0;
    box-shadow: 0 4rpx 12rpx rgba(15, 118, 110, 0.3);
    
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

/* 功能面板遮罩 */
.panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 40;
}

/* 功能面板 */
.function-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 120rpx;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  z-index: 45;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  
  &.visible {
    transform: translateY(0);
  }
}

/* 已选择预览区 */
.selected-preview {
  padding: 20rpx;
  border-bottom: 1rpx solid #F2F3F5;
  
  .preview-scroll {
    display: flex;
    gap: 16rpx;
    overflow-x: auto;
  }
  
  .preview-item {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    overflow: hidden;
    flex-shrink: 0;
    
    .preview-img {
      width: 100%;
      height: 100%;
    }
    
    .preview-remove {
      position: absolute;
      top: 4rpx;
      right: 4rpx;
      width: 32rpx;
      height: 32rpx;
      background-color: rgba(0, 0, 0, 0.5);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
    }
    
    &.file-item {
      width: auto;
      padding: 0 16rpx;
      background-color: #F2F3F5;
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      .file-icon { font-size: 32rpx; }
      .file-name {
        font-size: 24rpx;
        color: #1D2129;
        max-width: 200rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

/* 功能按钮行 */
.function-buttons {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 20rpx;
  
  .func-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    
    &.active .func-icon-wrap {
      background-color: rgba(15, 118, 110, 0.1);
    }
    
    .func-icon-wrap {
      width: 100rpx;
      height: 100rpx;
      background-color: #F7F8FA;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .func-icon { font-size: 44rpx; }
    .func-text { font-size: 24rpx; color: #86909C; }
  }
}

/* 输入行 */
.input-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx 30rpx;
  gap: 20rpx;
  background-color: #fff;
}

/* + 按钮 */
.plus-btn {
  width: 80rpx;
  height: 80rpx;
  background-color: #F7F8FA;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2rpx solid #E5E6EB;
  
  .plus-icon {
    font-size: 48rpx;
    color: #4E5969;
    font-weight: 300;
  }
}

/* 输入框 */
.input-box {
  flex: 1;
  height: 80rpx;
  background-color: #F7F8FA;
  border-radius: 40rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: #1D2129;
  border: 2rpx solid #E5E6EB;
}

/* 发送按钮 */
.send-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #0F766E 0%, #115E59 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(15, 118, 110, 0.3);
  
  &.disabled {
    background: #C9CDD4;
    box-shadow: none;
  }
  
  .send-icon {
    color: #fff;
    font-size: 40rpx;
    margin-left: 4rpx;
  }
}
</style>
