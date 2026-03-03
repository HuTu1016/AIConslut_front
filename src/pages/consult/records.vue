<template>
  <view class="records-container">
    <!-- 顶部背景 -->
    <view class="nav-bg"></view>

    <view class="content-wrapper">
      <view class="header-section">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="page-title">问诊记录</text>
      </view>

      <!-- 记录列表 -->
      <view class="record-list">
        <view 
          class="record-card" 
          v-for="item in records" 
          :key="item.appointmentId"
          @click="goDetail(item)"
        >
          <view class="card-header">
            <image class="doc-avatar" :src="item.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="doc-info">
              <text class="doc-name">{{ item.doctorName }} 医生</text>
              <text class="dept-name">{{ item.departmentName || '综合问诊' }}</text>
            </view>
            <view class="status-tag" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status) }}
            </view>
          </view>
          <view class="card-body">
            <text class="last-msg">{{ item.lastMessage || '暂无消息记录' }}</text>
          </view>
          <view class="card-footer">
            <text class="time">{{ formatTime(item.lastMessageTime) }}</text>
            <text class="action-text">查看详情 ›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && records.length === 0">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无问诊记录</text>
          <text class="empty-sub">预约医生问诊后，记录会出现在这里</text>
        </view>

        <!-- 加载中 -->
        <view class="loading-state" v-if="loading">
          <text>加载中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiGetConsultSessions } from '@/utils/request.js'

export default {
  data() {
    return {
      records: [],
      loading: false
    }
  },
  onShow() {
    this.loadRecords()
  },
  methods: {
    async loadRecords() {
      this.loading = true
      try {
        const res = await apiGetConsultSessions()
        if (res.code === 200 && res.data) {
          this.records = res.data
        }
      } catch (err) {
        console.error('加载问诊记录失败:', err)
      } finally {
        this.loading = false
      }
    },

    goDetail(item) {
      uni.navigateTo({
        url: `/pages/consult/chat?appointmentId=${item.appointmentId}&doctorId=${item.doctorId}&doctorName=${item.doctorName}`
      })
    },

    goBack() {
      uni.navigateBack()
    },

    getStatusText(status) {
      const map = { 0: '待支付', 10: '待就诊', 20: '就诊中', 30: '已完成', 40: '已取消', 50: '已退款' }
      return map[status] || '未知'
    },

    getStatusClass(status) {
      if (status === 20) return 'status-active'
      if (status === 30) return 'status-done'
      if (status === 40 || status === 50) return 'status-cancel'
      return 'status-wait'
    },

    formatTime(time) {
      if (!time) return ''
      const d = new Date(time)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${y}-${m}-${day} ${h}:${min}`
    }
  }
}
</script>

<style lang="scss">
.records-container {
  min-height: 100vh;
  background: #F7F8FA;
  position: relative;
}

.nav-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 280rpx;
  background: #0F766E;
  border-radius: 0 0 40rpx 40rpx;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  padding: 0 24rpx;
}

.header-section {
  padding-top: 60rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;

  .back-btn {
    width: 64rpx;
    height: 64rpx;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;

    .back-icon {
      font-size: 36rpx;
      color: #fff;
    }
  }

  .page-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #fff;
  }
}

.record-list {
  .record-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;

      .doc-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 16rpx;
        margin-right: 20rpx;
      }

      .doc-info {
        flex: 1;

        .doc-name {
          font-size: 30rpx;
          font-weight: 600;
          color: #1D2129;
          display: block;
        }

        .dept-name {
          font-size: 24rpx;
          color: #86909C;
          margin-top: 6rpx;
          display: block;
        }
      }

      .status-tag {
        font-size: 22rpx;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        flex-shrink: 0;

        &.status-active {
          background: rgba(82, 196, 26, 0.1);
          color: #52C41A;
        }
        &.status-done {
          background: rgba(15, 118, 110, 0.1);
          color: var(--primary-color);
        }
        &.status-cancel {
          background: rgba(134, 144, 156, 0.1);
          color: #86909C;
        }
        &.status-wait {
          background: rgba(234, 179, 8, 0.1);
          color: var(--warning-color);
        }
      }
    }

    .card-body {
      padding: 16rpx 0;
      border-top: 1rpx solid #F2F3F5;
      border-bottom: 1rpx solid #F2F3F5;

      .last-msg {
        font-size: 26rpx;
        color: #4E5969;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16rpx;

      .time {
        font-size: 24rpx;
        color: #C1C5CD;
      }

      .action-text {
        font-size: 24rpx;
        color: var(--primary-color);
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;

  .empty-icon { font-size: 120rpx; margin-bottom: 20rpx; }
  .empty-text { font-size: 30rpx; color: #86909C; margin-bottom: 10rpx; }
  .empty-sub { font-size: 24rpx; color: #C1C5CD; }
}

.loading-state {
  text-align: center;
  padding: 60rpx;
  font-size: 26rpx;
  color: #C1C5CD;
}
</style>
