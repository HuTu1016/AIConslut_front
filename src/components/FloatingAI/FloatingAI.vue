<template>
  <view 
    class="floating-ai" 
    :class="{ 'shake': isShaking, 'hide-half': isDocked }"
    :style="{ top: top + 'px', left: left + 'px' }"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @click="handleClick"
    v-if="isVisible"
  >
    <image class="ai-icon" src="/static/tabbar/ai.png" mode="scaleToFill"></image>
  </view>
</template>

<script>
export default {
  name: 'FloatingAI',
  data() {
    return {
      top: 0,
      left: 0,
      itemWidth: 60, // 图标大小 px (对应样式 120rpx)
      itemHeight: 60,
      windowWidth: 0,
      windowHeight: 0,
      isDragging: false,
      isDocked: true, // 是否处于吸附状态
      isShaking: false, // 是否正在抖动
      shakeTimer: null,
      isVisible: false, // 初始隐藏，位置计算完成后再显示
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0
    }
  },
  mounted() {
    // 获取屏幕尺寸
    const sys = uni.getSystemInfoSync()
    this.windowWidth = sys.windowWidth
    this.windowHeight = sys.windowHeight
    
    // 读取历史位置
    const storedPos = uni.getStorageSync('floating_ai_pos')
    if (storedPos) {
      this.top = storedPos.top
      this.left = storedPos.left
      // 如果读取了历史位置，我们需要判断是否需要吸附样式（因为存的是吸附后的位置）
      this.checkDockState()
    } else {
      // 初始位置：右侧靠下
      this.top = this.windowHeight * 0.7
      this.left = this.windowWidth - this.itemWidth + 15 
    }
    
    // 启动抖动定时器
    this.startShakeTimer()
    
    // 检查当前路由
    this.checkRoute()
  },
  beforeDestroy() {
    this.clearShakeTimer()
  },
  methods: {
    checkDockState() {
       // 简单的判断是否在边缘，用于恢复半隐藏状态
       if (this.left < 0 || this.left > this.windowWidth - this.itemWidth) {
         this.isDocked = true
       }
    },

    checkRoute() {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const route = pages[pages.length - 1].route
        if (route && route.includes('pages/ai/chat')) {
          this.isVisible = false
        } else {
          this.isVisible = true
        }
      }
    },
    
    startShakeTimer() {
      this.clearShakeTimer()
      this.shakeTimer = setInterval(() => {
        if (!this.isDragging) {
          this.isShaking = true
          setTimeout(() => {
            this.isShaking = false
          }, 1000)
        }
      }, 10000)
    },
    
    clearShakeTimer() {
      if (this.shakeTimer) {
        clearInterval(this.shakeTimer)
        this.shakeTimer = null
      }
    },
    
    onTouchStart(e) {
      this.isDragging = true
      this.isShaking = false
      this.isDocked = false
      
      const touch = e.touches[0]
      this.startX = touch.clientX
      this.startY = touch.clientY
      this.startLeft = this.left
      this.startTop = this.top
    },
    
    onTouchMove(e) {
      if (!this.isDragging) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - this.startX
      const deltaY = touch.clientY - this.startY
      
      let newLeft = this.startLeft + deltaX
      let newTop = this.startTop + deltaY
      
      if (newLeft < 0) newLeft = 0
      if (newLeft > this.windowWidth - this.itemWidth) newLeft = this.windowWidth - this.itemWidth
      if (newTop < 0) newTop = 0
      if (newTop > this.windowHeight - this.itemHeight) newTop = this.windowHeight - this.itemHeight
      
      this.left = newLeft
      this.top = newTop
    },
    
    onTouchEnd() {
      this.isDragging = false
      this.dockToEdge()
    },
    
    dockToEdge() {
      const edgeThreshold = 50 // 边缘吸附阈值（px），只有距离边缘小于此值才吸附
      
      // 判断是否靠近左边缘
      const nearLeftEdge = this.left < edgeThreshold
      // 判断是否靠近右边缘
      const nearRightEdge = this.left > this.windowWidth - this.itemWidth - edgeThreshold
      
      if (nearLeftEdge) {
        // 吸附到左侧
        this.left = -this.itemWidth * 0.3
        this.isDocked = true
      } else if (nearRightEdge) {
        // 吸附到右侧
        this.left = this.windowWidth - this.itemWidth * 0.7
        this.isDocked = true
      } else {
        // 不在边缘附近，保持当前位置，不吸附
        this.isDocked = false
      }
      
      // 保存位置到本地存储
      uni.setStorageSync('floating_ai_pos', {
        top: this.top,
        left: this.left
      })
    },
    
    handleClick() {
      if (this.isDragging) return
      
      uni.navigateTo({
        url: '/pages/ai/chat',
        fail: (err) => {
          console.error('跳转失败', err)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.floating-ai {
  position: fixed;
  width: 120rpx;
  height: 120rpx;
  z-index: 999;
  transition: opacity 0.3s; 
  /* 强制圆形裁剪 */
  border-radius: 50%;
  overflow: hidden;
  /* 消除图片底部的默认间隙 */
  font-size: 0;
  line-height: 0;
  /* 移除白色背景，使用透明 */
  background-color: transparent;
  /* 阴影效果 */
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  
  .ai-icon {
    width: 100%;
    height: 100%;
    display: block; 
    /* 放大图片1.3倍，配合overflow:hidden裁剪掉边缘白色部分 */
    transform: scale(1.3);
  }
  
  &.hide-half {
    opacity: 0.8;
    transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
}

/* 抖动动画 Keyframes */
@keyframes shake-animation {
  0% { transform: scale(1) rotate(0deg); }
  10% { transform: scale(1.1) rotate(-10deg); }
  20% { transform: scale(1.1) rotate(10deg); }
  30% { transform: scale(1.1) rotate(-10deg); }
  40% { transform: scale(1.1) rotate(10deg); }
  50% { transform: scale(1.1) rotate(0deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.shake {
  animation: shake-animation 1s ease-in-out;
}
</style>
