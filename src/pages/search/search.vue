<template>
  <view class="search-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索医生、科室、症状"
          focus
          confirm-type="search"
          @input="onInput"
          @confirm="doSearch"
        />
        <view class="clear-btn" v-if="keyword" @click="clearKeyword">
          <text>✕</text>
        </view>
      </view>
      <view class="cancel-btn" @click="goBack">取消</view>
    </view>

    <!-- 热门搜索（未输入关键词时显示） -->
    <view class="hot-search" v-if="!keyword && results.length === 0">
      <text class="section-title">热门搜索</text>
      <view class="tag-list">
        <view
          class="tag"
          v-for="(tag, index) in hotTags"
          :key="index"
          @click="onTagClick(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 搜索中 loading -->
    <view class="loading-box" v-if="loading">
      <text class="loading-text">搜索中...</text>
    </view>

    <!-- 搜索结果 -->
    <scroll-view class="result-list" scroll-y v-if="!loading && searched">
      <view
        class="doctor-card"
        v-for="doctor in results"
        :key="doctor.id"
        @click="goDoctorDetail(doctor)"
      >
        <image
          class="avatar"
          :src="$resolveImage(doctor.avatarUrl)"
          mode="aspectFill"
        ></image>
        <view class="info">
          <view class="header">
            <text class="name">{{ doctor.name }}</text>
            <text class="title">{{ doctor.title }}</text>
            <view class="rating">
              <text class="star">⭐</text>
              <text class="score">{{ doctor.rating || '5.0' }}</text>
            </view>
          </view>
          <text class="dept">{{ doctor.departmentName }}</text>
          <text class="intro">{{ doctor.introduction }}</text>
          <view class="footer">
            <text class="price">问诊费: ¥{{ doctor.consultPrice }}</text>
            <button class="book-btn" @click.stop="goBook(doctor)">立即预约</button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty" v-if="results.length === 0">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到相关医生</text>
        <text class="empty-tip">试试其他关键词，如科室名、症状</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { apiSearchDoctors } from '@/utils/request.js'
import { checkLogin } from '@/utils/store.js'

export default {
  data() {
    return {
      keyword: '',
      results: [],
      loading: false,
      searched: false, // 是否已执行过搜索
      searchTimer: null,
      hotTags: ['感冒发烧', '儿科', '内科', '皮肤科', '骨科', '神经内科', '心血管', '眼科']
    }
  },
  onLoad(options) {
    // 支持从首页传入初始关键词
    if (options.keyword) {
      this.keyword = decodeURIComponent(options.keyword)
      this.doSearch()
    }
  },
  onUnload() {
    // 清除防抖定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },
  methods: {
    /**
     * 输入防抖（300ms）
     */
    onInput() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.doSearch()
      }, 300)
    },

    /**
     * 执行搜索
     */
    async doSearch() {
      const kw = this.keyword.trim()
      if (!kw) {
        this.results = []
        this.searched = false
        return
      }

      this.loading = true
      this.searched = true
      try {
        const res = await apiSearchDoctors(kw)
        if (res.data) {
          this.results = Array.isArray(res.data) ? res.data : []
        }
      } catch (err) {
        console.error('搜索失败:', err)
        this.results = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 点击热门标签
     */
    onTagClick(tag) {
      this.keyword = tag
      this.doSearch()
    },

    /**
     * 清空关键词
     */
    clearKeyword() {
      this.keyword = ''
      this.results = []
      this.searched = false
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack()
    },

    /**
     * 跳转医生详情
     */
    goDoctorDetail(doctor) {
      uni.navigateTo({
        url: `/pages/doctor/detail?id=${doctor.id}`
      })
    },

    /**
     * 跳转预约
     */
    goBook(doctor) {
      if (!checkLogin()) return
      uni.navigateTo({
        url: `/pages/doctor/detail?id=${doctor.id}&action=book`
      })
    }
  }
}
</script>

<style lang="scss">
.search-container {
  min-height: 100vh;
  background: #F5F7FA;
}

/* 搜索栏 */
.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #F5F7FA;
    border-radius: 36rpx;
    padding: 0 24rpx;

    .search-icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .clear-btn {
      width: 36rpx;
      height: 36rpx;
      background: #C9CDD4;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 12rpx;

      text {
        font-size: 20rpx;
        color: #fff;
      }
    }
  }

  .cancel-btn {
    margin-left: 20rpx;
    font-size: 28rpx;
    color: #4B6EF2;
    flex-shrink: 0;
  }
}

/* 热门搜索 */
.hot-search {
  padding: 32rpx 24rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #1D2129;
    margin-bottom: 24rpx;
    display: block;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .tag {
      padding: 12rpx 28rpx;
      font-size: 26rpx;
      color: #4E5969;
      background: #fff;
      border-radius: 30rpx;
      box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.04);

      &:active {
        background: #EDF1FF;
        color: #4B6EF2;
      }
    }
  }
}

/* 加载中 */
.loading-box {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;

  .loading-text {
    font-size: 28rpx;
    color: #86909C;
  }
}

/* 搜索结果列表 */
.result-list {
  padding: 20rpx 24rpx;
  height: calc(100vh - 200rpx);
}

.doctor-card {
  display: flex;
  padding: 28rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 20rpx;
    background: #f0f0f0;
    flex-shrink: 0;
  }

  .info {
    flex: 1;
    margin-left: 24rpx;

    .header {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      .name {
        font-size: 34rpx;
        font-weight: bold;
        color: #1D2129;
      }

      .title {
        margin-left: 12rpx;
        font-size: 24rpx;
        color: #4B6EF2;
        background: rgba(75, 110, 242, 0.1);
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }

      .rating {
        margin-left: auto;
        display: flex;
        align-items: center;

        .star {
          font-size: 24rpx;
        }

        .score {
          margin-left: 4rpx;
          font-size: 26rpx;
          color: #E8A87C;
          font-weight: bold;
        }
      }
    }

    .dept {
      display: block;
      margin-top: 8rpx;
      font-size: 26rpx;
      color: #86909C;
    }

    .intro {
      display: block;
      margin-top: 12rpx;
      font-size: 26rpx;
      color: #4E5969;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16rpx;

      .price {
        font-size: 28rpx;
        color: #FF5252;
        font-weight: bold;
      }

      .book-btn {
        height: 56rpx;
        line-height: 56rpx;
        padding: 0 32rpx;
        font-size: 26rpx;
        color: #fff;
        background: linear-gradient(135deg, #4B6EF2, #7B96FF);
        border-radius: 28rpx;
        margin: 0;

        &::after {
          border: none;
        }
      }
    }
  }
}

/* 空状态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 24rpx;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 30rpx;
    color: #86909C;
    margin-bottom: 12rpx;
  }

  .empty-tip {
    font-size: 26rpx;
    color: #C9CDD4;
  }
}
</style>
