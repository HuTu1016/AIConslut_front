<template>
  <view class="home-container">
    <!-- 顶部自定义导航栏背景 -->
    <view class="nav-bg"></view>
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 头部：定位与搜索 -->
      <view class="header-section">
        <view class="header-top">
          <view class="location">
            <text class="icon">🏥</text>
            <text class="text">AI智慧问诊</text>
          </view>
          <view class="notification">
            <text class="icon">🔔</text>
          </view>
        </view>
        
        <view class="search-box" @click="goSearch">
          <text class="search-icon">🔍</text>
          <swiper class="search-swiper" vertical autoplay circular :interval="3000">
            <swiper-item class="search-item"><text>感冒发烧</text></swiper-item>
            <swiper-item class="search-item"><text>儿科专家号</text></swiper-item>
            <swiper-item class="search-item"><text>体检套餐</text></swiper-item>
          </swiper>
          <view class="search-btn">搜索</view>
        </view>
      </view>

      <!-- Banner 轮播 -->
      <swiper class="banner-swiper" indicator-dots autoplay circular indicator-active-color="#0F766E">
        <swiper-item>
          <view class="banner-item blue-theme">
            <view class="banner-text">
              <text class="big-title">AI 医疗助手</text>
              <text class="desc">24小时在线 · 精准分析 · 快速建议</text>
              <view class="action-btn" @click="goAiConsult">立即体验</view>
            </view>
            <image src="/static/banner-ai.png" mode="aspectFit" class="banner-img" v-if="false"></image>
            <text class="banner-emoji">🧠</text>
          </view>
        </swiper-item>
        <swiper-item>
          <view class="banner-item green-theme">
            <view class="banner-text">
              <text class="big-title">专家在线问诊</text>
              <text class="desc">图文视频 · 隐私保护 · 专业解答</text>
              <view class="action-btn" @click="goDoctorList({})">去咨询</view>
            </view>
            <text class="banner-emoji">🩺</text>
          </view>
        </swiper-item>
      </swiper>
      
      <!-- 科室导航 -->
      <view class="section">
        <view class="section-header">
          <text class="title">常用科室</text>
          <view class="more" @click="goDepartment">
            <text>全部</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <scroll-view scroll-x class="dept-scroll" :show-scrollbar="false">
          <view class="dept-wrapper">
            <view 
              class="dept-card" 
              v-for="dept in departments" 
              :key="dept.id"
              @click="goDoctorList(dept)"
            >
              <view class="icon-circle">
                <text class="emoji">{{ dept.icon }}</text>
              </view>
              <text class="name">{{ dept.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 健康资讯 -->
      <view class="section">
        <view class="section-header">
          <text class="title">健康资讯</text>
          <view class="more" @click="goArticleList">
            <text>更多</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="article-list">
          <view 
            class="article-card" 
            v-for="article in articles" 
            :key="article.id"
            @click="goArticleDetail(article)"
          >
            <view class="article-content">
              <text class="article-title">{{ article.title }}</text>
              <text class="article-summary">{{ article.summary }}</text>
              <view class="article-meta">
                <text class="author">{{ article.author || '健康小编' }}</text>
                <text class="time">{{ formatTime(article.createdAt) }}</text>
              </view>
            </view>
            <image 
              class="article-cover" 
              :src="article.coverUrl || '/static/default-article.png'" 
              mode="aspectFill"
              v-if="article.coverUrl"
            ></image>
          </view>
          <view class="empty-article" v-if="articles.length === 0">
            <text>暂无健康资讯</text>
          </view>
        </view>
      </view>

      <!-- 名医推荐 -->
      <view class="section">
        <view class="section-header">
          <text class="title">名医推荐</text>
          <view class="more" @click="goDoctorList({})">
            <text>更多</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <scroll-view scroll-x class="doctor-scroll-h" :show-scrollbar="false">
          <view class="doctor-h-wrapper">
            <view 
              class="doctor-h-card" 
              v-for="doctor in doctors.slice(0, 4)" 
              :key="doctor.id"
              @click="goDoctorDetail(doctor)"
            >
              <image class="avatar" :src="$resolveImage(doctor.avatarUrl)" mode="aspectFill"></image>
              <text class="name">{{ doctor.name }}</text>
              <text class="title-tag">{{ doctor.title }}</text>
              <view class="rating-row">
                <text class="star">★</text>
                <text class="score">{{ doctor.rating || '5.0' }}</text>
              </view>
              <view class="comment-box" v-if="doctor.latestComment">
                <text class="comment-text">"{{ doctor.latestComment }}"</text>
              </view>
              <view class="comment-box" v-else>
                <text class="comment-text">"专业耐心，值得信赖"</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view style="height: 120rpx;"></view>
    </view>
    
    <!-- 底部导航栏 -->
    <TabBar currentTab="home" />
    
    <!-- 全局悬浮球 -->
    <FloatingAI />
  </view>
</template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue'
import FloatingAI from '@/components/FloatingAI/FloatingAI.vue'
import { checkLogin } from '@/utils/store.js'
import { request, apiGetDoctors, apiGetRecommendArticles } from '@/utils/request.js'

// 科室图标映射
const DEPT_ICONS = {
  'NEURO': '🧠',
  'PEDI': '👶',
  'CARDIO': '❤️',
  'GASTRO': '🫁',
  'ORTHO': '🦴',
  'DERM': '🧴',
  'GYNEC': '👩',
  'OPHTH': '👁️'
}

export default {
  components: {
    TabBar,
    FloatingAI
  },
  data() {
    return {
      departments: [],
      doctors: [],
      articles: [],

    }
  },
  onLoad() {

    this.loadDepartments()
    this.loadDoctors()
    this.loadArticles()
  },
  onShow() {
    // 页面显示时可刷新数据
  },
  methods: {
    // 加载科室列表（只加载一级科室）
    async loadDepartments() {
      try {
        const res = await request({
          url: '/api/v1/public/departments/tree',
          method: 'GET'
        })
        if (res.code === 200 && res.data) {
          // 只取一级科室展示在首页
          this.departments = res.data.slice(0, 8).map(dept => ({
            ...dept,
            icon: dept.icon || DEPT_ICONS[dept.code] || '🏥'
          }))
        }
      } catch (err) {
        console.error('加载科室失败:', err)
      }
    },
    
    // 加载推荐医生
    async loadDoctors() {
      try {
        const res = await apiGetDoctors()
        if (res.data) {
          this.doctors = res.data.slice(0, 5)
        }
      } catch (err) {
        console.error('加载医生失败:', err)
      }
    },
    
    // 加载健康资讯
    async loadArticles() {
      try {
        const res = await apiGetRecommendArticles(3)
        if (res.data) {
          this.articles = res.data
        }
      } catch (err) {
        console.error('加载资讯失败:', err)
      }
    },
    
    goArticleList() {
      uni.navigateTo({ url: '/pages/article/list' })
    },
    
    goArticleDetail(article) {
      uni.navigateTo({ url: `/pages/article/detail?id=${article.id}` })
    },
    
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    
    goSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },
    
    goAiConsult() {
      uni.navigateTo({
        url: '/pages/ai/chat'
      })
    },
    
    goDepartment() {
      uni.navigateTo({
        url: '/pages/department/department'
      })
    },
    
    goAppointments() {
      if (!checkLogin()) return
      uni.navigateTo({
        url: '/pages/appointment/list'
      })
    },
    
    goDoctorList(dept) {
      if (!dept.id) {
        // 无具体科室（如banner"去咨询"），跳转全部医生列表
        uni.navigateTo({
          url: '/pages/doctor/list'
        })
        return
      }
      // 首页展示的是一级科室，统一跳转到科室页面展示子科室
      uni.navigateTo({
        url: `/pages/department/department?parentId=${dept.id}&parentName=${encodeURIComponent(dept.name)}`
      })
    },
    
    goDoctorDetail(doctor) {
      uni.navigateTo({
        url: `/pages/doctor/detail?id=${doctor.id}`
      })
    },
    
    goBook(doctor) {
      if (!checkLogin()) return
      uni.navigateTo({
        url: `/pages/appointment/book?doctorId=${doctor.id}`
      })
    },


  }
}
</script>

<style lang="scss">
.home-container {
  min-height: 100vh;
  background-color: #F7F8FA;
  padding-bottom: 20rpx;
  position: relative;
}

.nav-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 480rpx;
  background: var(--primary-gradient);
  border-radius: 0 0 40rpx 40rpx;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  padding: 0 24rpx;
}

/* Header */
.header-section {
  padding-top: 88rpx; /* 状态栏预留 */
  margin-bottom: 30rpx;
  
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .location {
      display: flex;
      align-items: center;
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      
      .icon { margin-right: 8rpx; }
      .arrow { font-size: 20rpx; margin-left: 8rpx; opacity: 0.8; }
    }
    
    .notification {
      width: 64rpx;
      height: 64rpx;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .icon { font-size: 32rpx; }
    }
  }
  
  .search-box {
    height: 80rpx;
    background: #fff;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    padding: 0 8rpx 0 32rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
    
    .search-icon {
      font-size: 32rpx;
      color: #999;
      margin-right: 16rpx;
    }
    
    .search-swiper {
      flex: 1;
      height: 80rpx;
      
      .search-item {
        display: flex;
        align-items: center;
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .search-btn {
      width: 120rpx;
      height: 64rpx;
      background: var(--primary-color);
      border-radius: 32rpx;
      color: #fff;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

/* Main Entry Card */
.main-entry-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 0;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
  
  .entry-grid {
    display: flex;
    justify-content: space-around;
    
    .entry-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .icon-box {
        width: 100rpx;
        height: 100rpx;
        border-radius: 30rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        
        .emoji-icon { font-size: 48rpx; }
        .icon-img { width: 60rpx; }
        
        &.ai-gradient { background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%); color: var(--primary-color); }
        &.book-gradient { background: linear-gradient(135deg, #E6FFFA 0%, #B5F5EC 100%); color: #00D09C; }
        &.record-gradient { background: linear-gradient(135deg, #FEFCE8 0%, #FEF08A 100%); color: var(--warning-color); }
      }
      
      .title {
        font-size: 28rpx;
        font-weight: bold;
        color: #1D2129;
        margin-bottom: 4rpx;
      }
      
      .sub-title {
        font-size: 22rpx;
        color: #86909C;
      }
    }
  }
}

/* Banner */
.banner-swiper {
  height: 240rpx;
  margin-bottom: 40rpx;
  
  .banner-item {
    height: 100%;
    border-radius: 24rpx;
    padding: 0 40rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    
    &.blue-theme { background: linear-gradient(120deg, #0F766E 0%, #14B8A6 100%); }
    &.green-theme { background: linear-gradient(120deg, #00D09C 0%, #26E6B8 100%); }
    
    .banner-text {
      position: relative;
      z-index: 2;
      
      .big-title {
        display: block;
        font-size: 40rpx;
        font-weight: 800;
        color: #fff;
        margin-bottom: 8rpx;
      }
      
      .desc {
        display: block;
        font-size: 24rpx;
        color: rgba(255,255,255,0.9);
        margin-bottom: 24rpx;
      }
      
      .action-btn {
        display: inline-block;
        padding: 8rpx 24rpx;
        background: #fff;
        color: #0F766E; /* Dynamic color based on parent not easy in css var without scope, keep simple */
        border-radius: 24rpx;
        font-size: 24rpx;
        font-weight: bold;
      }
    }
    
    &.green-theme .action-btn { color: #00D09C; }
    
    .banner-emoji {
      font-size: 140rpx;
      opacity: 0.3;
      position: absolute;
      right: -10rpx;
      bottom: -20rpx;
      transform: rotate(-15deg);
    }
    
    .banner-img {
      width: 200rpx;
      height: 200rpx;
      position: absolute;
      right: 0;
      bottom: 0;
    }
  }
}

/* Section */
.section {
  margin-bottom: 40rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding: 0 8rpx;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #1D2129;
      position: relative;
      padding-left: 20rpx;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 32rpx;
        background: var(--primary-color);
        border-radius: 4rpx;
      }
    }
    
    .more {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #86909C;
      
      .arrow { margin-left: 4rpx; font-size: 22rpx; }
    }
  }
}

/* Dept Scroll */
.dept-scroll {
  width: 100%;
  white-space: nowrap;
  
  .dept-wrapper {
    display: inline-flex;
    padding-bottom: 20rpx; /* Show shadow */
    
    .dept-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 30rpx;
      
      &:first-child { margin-left: 8rpx; }
      
      .icon-circle {
        width: 100rpx;
        height: 100rpx;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
        margin-bottom: 12rpx;
        
        .emoji { font-size: 44rpx; }
      }
      
      .name {
        font-size: 26rpx;
        color: #4E5969;
      }
    }
  }
}

/* Doctor List */
.doctor-list {
  .doctor-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
    display: flex;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
    
    .card-left {
      margin-right: 24rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 16rpx;
        background: #F0F2F5;
        margin-bottom: 12rpx;
      }
      
      .rating-badge {
        display: flex;
        align-items: center;
        background: #FFF7E6;
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
        
        .star { font-size: 20rpx; color: var(--warning-color); margin-right: 4rpx; }
        .score { font-size: 22rpx; color: var(--warning-color); font-weight: bold; }
      }
    }
    
    .card-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .name-row {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .name { font-size: 32rpx; font-weight: bold; color: #1D2129; margin-right: 12rpx; }
        .title-tag { 
          font-size: 20rpx; 
          color: #fff; 
          background: #86909C; 
          padding: 2rpx 8rpx; 
          border-radius: 4rpx; 
        }
      }
      
      .info-row {
        display: flex;
        align-items: center;
        margin-bottom: 12rpx;
        
        .dept-name { font-size: 24rpx; color: #1D2129; margin-right: 16rpx; }
        .hospital-name { font-size: 24rpx; color: #86909C; }
      }
      
      .intro {
        font-size: 24rpx;
        color: #86909C;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
        margin-bottom: 16rpx;
      }
      
      .bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1rpx solid #F2F3F5;
        padding-top: 16rpx;
        
        .price {
          font-size: 32rpx;
          color: #FF5252;
          font-weight: bold;
        }
        
        .book-btn {
          margin: 0;
          padding: 0;
          width: 140rpx;
          height: 56rpx;
          line-height: 56rpx;
          background: var(--primary-color);
          color: #fff;
          font-size: 24rpx;
          border-radius: 28rpx;
        }
      }
    }
  }
}

/* 健康资讯样式 */
.article-list {
  .article-card {
    display: flex;
    background: #fff;
    padding: 24rpx;
    margin-bottom: 20rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    
    .article-content {
      flex: 1;
      margin-right: 20rpx;
      
      .article-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #1D2129;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        margin-bottom: 12rpx;
      }
      
      .article-summary {
        font-size: 24rpx;
        color: #86909C;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        margin-bottom: 12rpx;
      }
      
      .article-meta {
        display: flex;
        align-items: center;
        font-size: 22rpx;
        color: #C9CDD4;
        
        .author {
          margin-right: 16rpx;
        }
      }
    }
    
    .article-cover {
      width: 160rpx;
      height: 120rpx;
      border-radius: 12rpx;
      flex-shrink: 0;
    }
  }
  
  .empty-article {
    text-align: center;
    padding: 40rpx;
    color: #999;
    font-size: 26rpx;
  }
}

/* 名医推荐横向样式 */
.doctor-scroll-h {
  white-space: nowrap;
  
  .doctor-h-wrapper {
    display: inline-flex;
    padding: 0 10rpx;
  }
  
  .doctor-h-card {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: 200rpx;
    padding: 24rpx 16rpx;
    margin-right: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      margin-bottom: 12rpx;
    }
    
    .name {
      font-size: 26rpx;
      font-weight: bold;
      color: #1D2129;
      margin-bottom: 6rpx;
    }
    
    .title-tag {
      font-size: 20rpx;
      color: var(--primary-color);
      background: rgba(15, 118, 110, 0.1);
      padding: 4rpx 10rpx;
      border-radius: 6rpx;
      margin-bottom: 8rpx;
    }
    
    .rating-row {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .star {
        color: var(--warning-color);
        font-size: 24rpx;
        margin-right: 4rpx;
      }
      
      .score {
        font-size: 24rpx;
        font-weight: bold;
        color: #1D2129;
      }
    }
    
    .comment-box {
      width: 100%;
      background: #F7F8FA;
      border-radius: 8rpx;
      padding: 10rpx;
      
      .comment-text {
        font-size: 20rpx;
        color: #86909C;
        white-space: normal;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        line-height: 1.4;
      }
    }
  }
}
</style>
