<template>
  <view class="article-list-page">
    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-bar" :show-scrollbar="false">
      <view class="category-wrapper">
        <view
          class="category-item"
          :class="{ active: currentCategory === '' }"
          @click="changeCategory('')"
        >全部</view>
        <view
          class="category-item"
          :class="{ active: currentCategory === 'HEALTH' }"
          @click="changeCategory('HEALTH')"
        >健康科普</view>
        <view
          class="category-item"
          :class="{ active: currentCategory === 'NEWS' }"
          @click="changeCategory('NEWS')"
        >医院新闻</view>
        <view
          class="category-item"
          :class="{ active: currentCategory === 'NOTICE' }"
          @click="changeCategory('NOTICE')"
        >通知公告</view>
      </view>
    </scroll-view>

    <!-- 文章列表 -->
    <scroll-view
      scroll-y
      class="article-scroll"
      @scrolltolower="loadMore"
      :show-scrollbar="false"
    >
      <view class="article-card" v-for="item in articles" :key="item.id" @click="goDetail(item)">
        <view class="card-body">
          <view class="card-text">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-summary">{{ item.summary }}</text>
            <view class="card-meta">
              <text class="meta-author">{{ item.authorName || '健康小编' }}</text>
              <text class="meta-dot">·</text>
              <text class="meta-time">{{ formatDate(item.publishTime) }}</text>
              <view class="meta-stats">
                <text>👁 {{ item.viewCount || 0 }}</text>
                <text style="margin-left: 16rpx;">👍 {{ item.likeCount || 0 }}</text>
              </view>
            </view>
          </view>
          <image
            v-if="item.coverImage"
            class="card-cover"
            :src="getCoverUrl(item.coverImage)"
            mode="aspectFill"
          ></image>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="load-status" v-if="articles.length > 0">
        <text v-if="loading">加载中...</text>
        <text v-else-if="noMore">— 已经到底了 —</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && articles.length === 0">
        <text class="empty-icon">📰</text>
        <text class="empty-text">暂无资讯文章</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { apiGetArticles, BASE_URL } from '@/utils/request.js'

export default {
  data() {
    return {
      currentCategory: '',
      articles: [],
      page: 1,
      size: 10,
      loading: false,
      noMore: false
    }
  },
  onLoad() {
    this.loadArticles()
  },
  methods: {
    /** 切换分类 */
    changeCategory(category) {
      this.currentCategory = category
      this.page = 1
      this.articles = []
      this.noMore = false
      this.loadArticles()
    },

    /** 加载文章列表 */
    async loadArticles() {
      if (this.loading || this.noMore) return
      this.loading = true
      try {
        const params = { page: this.page, size: this.size }
        if (this.currentCategory) {
          params.category = this.currentCategory
        }
        const res = await apiGetArticles(params)
        if (res.data) {
          const records = res.data.records || []
          this.articles = this.page === 1 ? records : [...this.articles, ...records]
          // 判断是否还有更多
          if (records.length < this.size) {
            this.noMore = true
          }
        }
      } catch (err) {
        console.error('加载文章列表失败:', err)
      } finally {
        this.loading = false
      }
    },

    /** 上拉加载更多 */
    loadMore() {
      if (!this.noMore && !this.loading) {
        this.page++
        this.loadArticles()
      }
    },

    /** 跳转文章详情 */
    goDetail(article) {
      uni.navigateTo({
        url: `/pages/article/detail?id=${article.id}`
      })
    },

    /** 格式化日期 */
    formatDate(time) {
      if (!time) return ''
      const date = new Date(time)
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    },

    /** 获取封面图完整URL */
    getCoverUrl(url) {
      if (!url) return ''
      return url.startsWith('http') ? url : BASE_URL + url
    }
  }
}
</script>

<style lang="scss">
.article-list-page {
  min-height: 100vh;
  background: #F7F8FA;
  display: flex;
  flex-direction: column;
}

/* 分类标签栏 */
.category-bar {
  background: #fff;
  white-space: nowrap;
  border-bottom: 1rpx solid #F0F2F5;
  flex-shrink: 0;

  .category-wrapper {
    display: inline-flex;
    padding: 20rpx 24rpx;
    gap: 16rpx;
  }

  .category-item {
    display: inline-block;
    padding: 12rpx 32rpx;
    font-size: 26rpx;
    color: #4E5969;
    background: #F2F3F5;
    border-radius: 30rpx;
    transition: all 0.2s;

    &.active {
      color: #fff;
      background: var(--primary-color);
      font-weight: bold;
    }
  }
}

/* 文章滚动区 */
.article-scroll {
  flex: 1;
  padding: 24rpx;
}

/* 文章卡片 */
.article-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);

  .card-body {
    display: flex;
    align-items: flex-start;
  }

  .card-text {
    flex: 1;
    margin-right: 20rpx;
    display: flex;
    flex-direction: column;
  }

  .card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #1D2129;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    margin-bottom: 12rpx;
    line-height: 1.4;
  }

  .card-summary {
    font-size: 24rpx;
    color: #86909C;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    margin-bottom: 16rpx;
    line-height: 1.5;
  }

  .card-meta {
    display: flex;
    align-items: center;
    font-size: 22rpx;
    color: #C9CDD4;
    flex-wrap: wrap;

    .meta-author {
      color: var(--primary-color);
    }

    .meta-dot {
      margin: 0 8rpx;
    }

    .meta-stats {
      margin-left: auto;
    }
  }

  .card-cover {
    width: 180rpx;
    height: 130rpx;
    border-radius: 12rpx;
    flex-shrink: 0;
  }
}

/* 加载状态 */
.load-status {
  text-align: center;
  padding: 30rpx;
  font-size: 24rpx;
  color: #C9CDD4;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

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
