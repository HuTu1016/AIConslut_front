<template>
  <view class="article-detail-page">
    <!-- 加载中 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 文章内容 -->
    <view class="article-wrapper" v-if="!loading && article">
      <!-- 文章头部 -->
      <view class="article-header">
        <text class="article-title">{{ article.title }}</text>
        <view class="article-info">
          <view class="author-info">
            <view class="author-avatar">
              <text>{{ (article.authorName || '编').substring(0, 1) }}</text>
            </view>
            <view class="author-detail">
              <text class="author-name">{{ article.authorName || '健康小编' }}</text>
              <text class="publish-time">{{ formatDate(article.publishTime) }}</text>
            </view>
          </view>
          <view class="category-tag" v-if="article.category">
            <text>{{ getCategoryName(article.category) }}</text>
          </view>
        </view>
      </view>

      <!-- 文章正文(富文本) -->
      <view class="article-body">
        <rich-text :nodes="article.content || ''"></rich-text>
      </view>

      <!-- 文章底部统计 -->
      <view class="article-footer">
        <view class="stat-item">
          <text class="stat-icon">👁</text>
          <text class="stat-num">{{ article.viewCount || 0 }} 阅读</text>
        </view>
        <view class="stat-item" @click="handleLike">
          <text class="stat-icon">{{ liked ? '👍' : '👍🏻' }}</text>
          <text class="stat-num" :class="{ liked: liked }">{{ likeCount }} 点赞</text>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view class="empty-state" v-if="!loading && !article">
      <text class="empty-icon">😶</text>
      <text class="empty-text">文章不存在或已下架</text>
    </view>
  </view>
</template>

<script>
import { apiGetArticleDetail, apiLikeArticle } from '@/utils/request.js'

export default {
  data() {
    return {
      articleId: null,
      article: null,
      loading: true,
      liked: false,
      likeCount: 0
    }
  },
  onLoad(options) {
    if (options.id) {
      this.articleId = options.id
      this.loadArticle()
    }
  },
  /** 设置分享 */
  onShareAppMessage() {
    return {
      title: this.article?.title || '健康资讯',
      path: `/pages/article/detail?id=${this.articleId}`
    }
  },
  methods: {
    /** 加载文章详情 */
    async loadArticle() {
      this.loading = true
      try {
        const res = await apiGetArticleDetail(this.articleId)
        if (res.data) {
          this.article = res.data
          this.likeCount = res.data.likeCount || 0
          // 设置导航栏标题
          uni.setNavigationBarTitle({ title: res.data.title || '资讯详情' })
        }
      } catch (err) {
        console.error('加载文章详情失败:', err)
      } finally {
        this.loading = false
      }
    },

    /** 点赞 */
    async handleLike() {
      if (this.liked) {
        uni.showToast({ title: '已点赞', icon: 'none' })
        return
      }
      try {
        await apiLikeArticle(this.articleId)
        this.liked = true
        this.likeCount++
        uni.showToast({ title: '点赞成功', icon: 'success' })
      } catch (err) {
        console.error('点赞失败:', err)
      }
    },

    /** 获取分类中文名 */
    getCategoryName(category) {
      const map = {
        'HEALTH': '健康科普',
        'NEWS': '医院新闻',
        'NOTICE': '通知公告'
      }
      return map[category] || category
    },

    /** 格式化日期 */
    formatDate(time) {
      if (!time) return ''
      const date = new Date(time)
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
}
</script>

<style lang="scss">
.article-detail-page {
  min-height: 100vh;
  background: #fff;
}

/* 加载中 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  font-size: 28rpx;
  color: #86909C;
}

/* 文章头部 */
.article-header {
  padding: 32rpx 32rpx 0;

  .article-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #1D2129;
    line-height: 1.4;
    display: block;
    margin-bottom: 28rpx;
  }

  .article-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 28rpx;
    border-bottom: 1rpx solid #F2F3F5;
  }

  .author-info {
    display: flex;
    align-items: center;

    .author-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #4B6EF2, #7B96FF);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      color: #fff;
      font-size: 28rpx;
      font-weight: bold;
    }

    .author-detail {
      display: flex;
      flex-direction: column;

      .author-name {
        font-size: 28rpx;
        font-weight: 500;
        color: #1D2129;
      }

      .publish-time {
        font-size: 22rpx;
        color: #C9CDD4;
        margin-top: 4rpx;
      }
    }
  }

  .category-tag {
    padding: 6rpx 20rpx;
    background: #EDF2FF;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: #4B6EF2;
  }
}

/* 文章正文 */
.article-body {
  padding: 32rpx;
  font-size: 30rpx;
  color: #4E5969;
  line-height: 1.8;
}

/* 文章底部 */
.article-footer {
  display: flex;
  justify-content: center;
  gap: 80rpx;
  padding: 40rpx 32rpx;
  border-top: 1rpx solid #F2F3F5;
  margin: 0 32rpx;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .stat-icon {
      font-size: 36rpx;
    }

    .stat-num {
      font-size: 26rpx;
      color: #86909C;

      &.liked {
        color: #4B6EF2;
        font-weight: bold;
      }
    }
  }
}

/* 错误/空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300rpx;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #86909C;
  }
}
</style>
