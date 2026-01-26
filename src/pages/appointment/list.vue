<template>
  <view class="list-container">
    <!-- 返回按钮 -->

    
    <!-- 状态筛选 -->
    <view class="filter-tabs">
      <view 
        class="tab-item" 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>
    
    <!-- 预约列表 -->
    <scroll-view class="appointment-scroll" scroll-y @scrolltolower="loadMore">
      <view 
        class="appointment-card" 
        v-for="item in filteredList" 
        :key="item.id"
        @click="goDetail(item)"
      >
        <view class="card-header">
          <text class="ticket-no">{{ item.ticketNo }}</text>
          <text class="status" :class="'status-' + item.status">{{ getStatusText(item.status) }}</text>
        </view>
        
        <view class="card-body">
          <image class="avatar" :src="item.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ item.doctorName }}</text>
              <text class="title">{{ item.doctorTitle }}</text>
            </view>
            <text class="dept">{{ item.departmentName }}</text>
            <text class="patient">就诊人：{{ item.patientName }}</text>
          </view>
        </view>
        
        <view class="card-footer">
          <view class="time-info">
            <text class="label">预约时间</text>
            <text class="time">{{ formatTime(item.appointmentTime) }}</text>
          </view>
          <view class="actions">
            <!-- 待支付状态：显示支付和取消按钮 -->
            <template v-if="item.status === 0">
              <button class="btn btn-cancel" @click.stop="handleCancel(item)">取消</button>
              <button class="btn btn-primary" @click.stop="handlePay(item)">去支付</button>
            </template>
            
            <!-- 待就诊状态：显示进入问诊按钮 -->
            <template v-else-if="item.status === 10">
              <button class="btn btn-cancel" @click.stop="handleCancel(item)">取消</button>
              <button class="btn btn-primary" @click.stop="goConsult(item)">进入问诊</button>
            </template>
            
            <!-- 就诊中状态 -->
            <template v-else-if="item.status === 20">
              <button class="btn btn-primary" @click.stop="goConsult(item)">继续问诊</button>
            </template>
            
            <!-- 已完成状态：查看病历 -->
            <template v-else-if="item.status === 30">
              <button class="btn btn-outline" @click.stop="goRecord(item)">查看病历</button>
            </template>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty" v-if="!loading && filteredList.length === 0">
        <text class="icon">📋</text>
        <text class="text">暂无预约记录</text>
        <button class="btn-book" @click="goHome">去预约</button>
      </view>
      
      <!-- 加载状态 -->
      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { apiGetAppointments, apiCancelAppointment } from '@/utils/request.js'

export default {
  data() {
    return {
      currentTab: '',
      loading: false,
      tabs: [
        { label: '全部', value: '' },
        { label: '待支付', value: '0' },
        { label: '待就诊', value: '10' },
        { label: '已完成', value: '30' },
        { label: '已取消', value: '40' }
      ],
      list: [],
      // 分页相关
      page: 1,
      pageSize: 10,
      hasMore: true
    }
  },
  computed: {
    filteredList() {
      if (!this.currentTab) {
        return this.list
      }
      return this.list.filter(item => item.status == this.currentTab)
    }
  },
  onLoad(options) {
    if (options.status) {
      this.currentTab = options.status
    }
    this.loadData()
  },
  methods: {
    async loadData(isLoadMore = false) {
      if (this.loading) return
      if (isLoadMore && !this.hasMore) return
      
      this.loading = true
      try {
        const params = {
          page: this.page,
          size: this.pageSize
        }
        if (this.currentTab !== '' && this.currentTab !== undefined && this.currentTab !== null) {
          params.status = this.currentTab
        }
        const res = await apiGetAppointments(params)
        if (res.data) {
          const records = res.data.records || res.data.list || res.data || []
          if (isLoadMore) {
            this.list = [...this.list, ...records]
          } else {
            this.list = records
          }
          // 判断是否还有更多数据
          const total = res.data.total || 0
          this.hasMore = this.list.length < total
        }
      } catch (err) {
        console.error('加载预约列表失败:', err)
      } finally {
        this.loading = false
      }
    },
    
    switchTab(value) {
      this.currentTab = value
      // 切换tab时重置分页
      this.page = 1
      this.hasMore = true
      this.loadData()
    },
    
    getStatusText(status) {
      const map = {
        0: '待支付',
        10: '待就诊',
        20: '就诊中',
        30: '已完成',
        40: '已取消',
        50: '已退款'
      }
      return map[status] || '未知'
    },
    
    // 格式化时间：将ISO格式转换为友好格式
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    goDetail(item) {
      uni.navigateTo({
        url: `/pages/appointment/detail?id=${item.id}`
      })
    },
    
    handlePay(item) {
      uni.navigateTo({
        url: `/pages/payment/pay?appointmentId=${item.id}`
      })
    },
    
    async handleCancel(item) {
      uni.showModal({
        title: '提示',
        content: '确定要取消该预约吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await apiCancelAppointment(item.id)
              uni.showToast({ title: '取消成功', icon: 'success' })
              item.status = 40
            } catch (err) {
              console.error('取消失败:', err)
            }
          }
        }
      })
    },
    
    goConsult(item) {
      uni.navigateTo({
        url: `/pages/consult/chat?appointmentId=${item.id}&doctorId=${item.doctorId}&doctorName=${item.doctorName}`
      })
    },
    
    goRecord(item) {
      uni.navigateTo({
        url: `/pages/consult/record?appointmentId=${item.id}`
      })
    },
    
    goHome() {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    },
    
    loadMore() {
      if (this.loading || !this.hasMore) return
      this.page++
      this.loadData(true)
    }
  }
}
</script>

<style lang="scss">
.list-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  display: flex;
  flex-direction: column;
}

.filter-tabs {
  display: flex;
  background: #fff;
  padding: 20rpx;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: #666;
    position: relative;
    
    &.active {
      color: #4A90D9;
      font-weight: 500;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: #4A90D9;
        border-radius: 2rpx;
      }
    }
  }
}

.appointment-scroll {
  flex: 1;
  padding: 20rpx;
}

.appointment-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .ticket-no {
      font-size: 24rpx;
      color: #999;
    }
    
    .status {
      font-size: 24rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      
      &.status-0 {
        color: #E8A87C;
        background: rgba(232, 168, 124, 0.1);
      }
      
      &.status-10 {
        color: #4A90D9;
        background: rgba(74, 144, 217, 0.1);
      }
      
      &.status-20 {
        color: #6BB392;
        background: rgba(107, 179, 146, 0.1);
      }
      
      &.status-30 {
        color: #999;
        background: #f5f5f5;
      }
      
      &.status-40,
      &.status-50 {
        color: #999;
        background: #f5f5f5;
      }
    }
  }
  
  .card-body {
    display: flex;
    padding: 20rpx 0;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 16rpx;
      background: #f0f0f0;
    }
    
    .info {
      flex: 1;
      margin-left: 20rpx;
      
      .name-row {
        display: flex;
        align-items: center;
        
        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
        
        .title {
          margin-left: 12rpx;
          font-size: 24rpx;
          color: #4A90D9;
        }
      }
      
      .dept {
        display: block;
        margin-top: 8rpx;
        font-size: 26rpx;
        color: #999;
      }
      
      .patient {
        display: block;
        margin-top: 8rpx;
        font-size: 26rpx;
        color: #666;
      }
    }
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;
    
    .time-info {
      .label {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
      
      .time {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-top: 4rpx;
      }
    }
    
    .actions {
      display: flex;
      gap: 16rpx;
      
      .btn {
        height: 60rpx;
        line-height: 60rpx;
        padding: 0 28rpx;
        font-size: 26rpx;
        border-radius: 30rpx;
        margin: 0;
        
        &::after {
          border: none;
        }
        
        &.btn-primary {
          color: #fff;
          background: linear-gradient(135deg, #4A90D9, #67B8DE);
        }
        
        &.btn-cancel {
          color: #999;
          background: #f5f5f5;
        }
        
        &.btn-outline {
          color: #4A90D9;
          background: #fff;
          border: 2rpx solid #4A90D9;
        }
      }
    }
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  
  .icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }
  
  .btn-book {
    height: 72rpx;
    line-height: 72rpx;
    padding: 0 60rpx;
    font-size: 28rpx;
    color: #fff;
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    border-radius: 36rpx;
    
    &::after {
      border: none;
    }
  }
}

.load-more {
  text-align: center;
  padding: 30rpx;
  
  text {
    font-size: 26rpx;
    color: #999;
  }
}
</style>
