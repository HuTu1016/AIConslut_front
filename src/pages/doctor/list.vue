<template>
  <view class="doctor-list-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view 
        class="filter-item" 
        :class="{ active: currentDeptId === '' }"
        @click="filterByDept('')"
      >
        全部
      </view>
      <view 
        class="filter-item" 
        v-for="dept in departments" 
        :key="dept.id"
        :class="{ active: currentDeptId == dept.id }"
        @click="filterByDept(dept.id)"
      >
        {{ dept.name }}
      </view>
    </view>
    
    <!-- 医生列表 -->
    <scroll-view class="doctor-scroll" scroll-y @scrolltolower="loadMore">
      <view 
        class="doctor-card" 
        v-for="doctor in filteredDoctors" 
        :key="doctor.id"
        @click="goDoctorDetail(doctor)"
      >
        <image 
          class="avatar" 
          :src="doctor.avatarUrl || '/static/default-avatar.png'" 
          mode="aspectFill"
        ></image>
        <view class="info">
          <view class="header">
            <text class="name">{{ doctor.name }}</text>
            <text class="title">{{ doctor.title }}</text>
            <view class="rating">
              <text class="star">⭐</text>
              <text class="score">{{ doctor.rating }}</text>
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
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty" v-if="!loading && filteredDoctors.length === 0">
        <text class="icon">👨‍⚕️</text>
        <text class="text">暂无医生</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { checkLogin } from '@/utils/store.js'
import { apiGetDepartments, apiGetDoctors } from '@/utils/request.js'

export default {
  data() {
    return {
      currentDeptId: '',
      loading: false,
      departments: [],
      doctors: []
    }
  },
  computed: {
    filteredDoctors() {
      if (!this.currentDeptId) {
        return this.doctors
      }
      return this.doctors.filter(d => d.departmentId == this.currentDeptId)
    }
  },
  onLoad(options) {
    if (options.deptId) {
      this.currentDeptId = options.deptId
    }
    if (options.deptName) {
      uni.setNavigationBarTitle({
        title: options.deptName + ' - 医生列表'
      })
    }
    this.loadDepartments()
    this.loadDoctors()
  },
  methods: {
    async loadDepartments() {
      try {
        const res = await apiGetDepartments()
        if (res.data) {
          this.departments = res.data
        }
      } catch (err) {
        console.error('加载科室失败:', err)
      }
    },
    
    async loadDoctors() {
      this.loading = true
      try {
        // 如果有指定科室，则按科室查询
        const res = await apiGetDoctors(this.currentDeptId || undefined)
        if (res.data) {
          this.doctors = res.data
        }
      } catch (err) {
        console.error('加载医生失败:', err)
      } finally {
        this.loading = false
      }
    },
    
    filterByDept(deptId) {
      this.currentDeptId = deptId
      this.loadDoctors()
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
    
    loadMore() {
      // TODO: 分页加载
    }
  }
}
</script>

<style lang="scss">
.doctor-list-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 20rpx;
  background: #fff;
  white-space: nowrap;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  .filter-item {
    flex-shrink: 0;
    padding: 12rpx 28rpx;
    margin-right: 16rpx;
    font-size: 26rpx;
    color: #666;
    background: #F5F7FA;
    border-radius: 30rpx;
    
    &.active {
      color: #fff;
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
    }
  }
}

.doctor-scroll {
  flex: 1;
  padding: 20rpx;
}

.doctor-card {
  display: flex;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  
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
        color: #333;
      }
      
      .title {
        margin-left: 12rpx;
        font-size: 24rpx;
        color: #4A90D9;
        background: rgba(74, 144, 217, 0.1);
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
      color: #999;
    }
    
    .intro {
      display: block;
      margin-top: 12rpx;
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16rpx;
      
      .price {
        font-size: 28rpx;
        color: #E8A87C;
        font-weight: bold;
      }
      
      .book-btn {
        height: 56rpx;
        line-height: 56rpx;
        padding: 0 32rpx;
        font-size: 26rpx;
        color: #fff;
        background: linear-gradient(135deg, #4A90D9, #67B8DE);
        border-radius: 28rpx;
        margin: 0;
        
        &::after {
          border: none;
        }
      }
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
  }
}
</style>
