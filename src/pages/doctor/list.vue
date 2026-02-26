<template>
  <view class="doctor-list-container">
    <!-- 返回按钮 -->

    
    <!-- 筛选栏 -->
    <scroll-view 
      class="filter-bar" 
      scroll-x 
      :scroll-into-view="scrollIntoViewId"
      scroll-with-animation
    >
      <view class="filter-inner">
        <view 
          id="dept-all"
          class="filter-item" 
          :class="{ active: currentDeptId === '' }"
          @click="filterByDept('')"
        >
          全部
        </view>
        <view 
          v-for="dept in departments" 
          :key="dept.id"
          :id="'dept-' + dept.id"
          class="filter-item" 
          :class="{ active: currentDeptId == dept.id }"
          @click="filterByDept(dept.id)"
        >
          {{ dept.name }}
        </view>
      </view>
    </scroll-view>
    
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
import { request } from '@/utils/request.js'
import { apiGetDepartments, apiGetDoctors } from '@/utils/request.js'

export default {
  data() {
    return {
      currentDeptId: '',
      scrollIntoViewId: '',
      parentId: null,        // 父科室ID，有值时筛选栏只显示该父科室下的子科室
      parentName: '',
      siblingDeptIds: [],     // 同级子科室ID列表，用于"全部"过滤
      loading: false,
      departments: [],
      doctors: [],
      // 分页相关
      page: 1,
      pageSize: 10,
      hasMore: true
    }
  },
  computed: {
    filteredDoctors() {
      if (this.currentDeptId) {
        // 选中了具体科室，按该科室过滤
        return this.doctors.filter(d => d.departmentId == this.currentDeptId)
      }
      if (this.parentId && this.siblingDeptIds.length > 0) {
        // 有父科室限定，"全部"只显示父科室下所有子科室的医生
        return this.doctors.filter(d => this.siblingDeptIds.includes(d.departmentId))
      }
      // 无父科室限定，显示所有医生
      return this.doctors
    }
  },
  onLoad(options) {
    if (options.deptId) {
      this.currentDeptId = options.deptId
    }
    // 接收父科室参数
    if (options.parentId) {
      this.parentId = parseInt(options.parentId)
      this.parentName = decodeURIComponent(options.parentName || '')
    }
    if (options.deptName) {
      // 导航栏显示父科室名称（如有）
      const title = this.parentName 
        ? this.parentName + ' - 医生列表'
        : options.deptName + ' - 医生列表'
      uni.setNavigationBarTitle({ title })
    }
    this.loadDepartments()
    this.loadDoctors()
  },
  methods: {
    async loadDepartments() {
      try {
        if (this.parentId) {
          // 有父科室：从树接口获取该父科室下的子科室
          const res = await request({
            url: '/api/v1/public/departments/tree',
            method: 'GET'
          })
          if ((res.code === 200 || res.code === 0) && res.data) {
            const parent = res.data.find(d => d.id === this.parentId)
            if (parent && parent.children) {
              this.departments = parent.children
              this.siblingDeptIds = parent.children.map(c => c.id)
            }
          }
        } else {
          // 无父科室：加载全部科室
          const res = await apiGetDepartments()
          if (res.data) {
            this.departments = res.data
          }
        }
        // 科室加载完成后，自动滚动到选中的科室标签
        if (this.currentDeptId) {
          this.$nextTick(() => {
            this.scrollIntoViewId = 'dept-' + this.currentDeptId
          })
        }
      } catch (err) {
        console.error('加载科室失败:', err)
      }
    },
    
    async loadDoctors(isLoadMore = false) {
      if (this.loading) return
      if (isLoadMore && !this.hasMore) return
      
      this.loading = true
      try {
        // 加载医生列表（不传科室ID，加载全部，由 filteredDoctors 客户端过滤）
        const res = await apiGetDoctors()
        if (res.data) {
          const records = Array.isArray(res.data) ? res.data : (res.data.records || [])
          if (isLoadMore) {
            this.doctors = [...this.doctors, ...records]
          } else {
            this.doctors = records
          }
          this.hasMore = records.length >= this.pageSize
        }
      } catch (err) {
        console.error('加载医生失败:', err)
      } finally {
        this.loading = false
      }
    },
    
    filterByDept(deptId) {
      this.currentDeptId = deptId
      // 切换科室时重置分页
      this.page = 1
      this.hasMore = true
      // 客户端过滤，无需重新请求
    },
    
    goDoctorDetail(doctor) {
      uni.navigateTo({
        url: `/pages/doctor/detail?id=${doctor.id}`
      })
    },
    
    goBook(doctor) {
      if (!checkLogin()) return
      // 跳转到医生详情页选择排班后再预约
      uni.navigateTo({
        url: `/pages/doctor/detail?id=${doctor.id}&action=book`
      })
    },
    
    loadMore() {
      if (this.loading || !this.hasMore) return
      this.page++
      this.loadDoctors(true)
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
  width: 100%;
  white-space: nowrap;
  background: #fff;
  
  .filter-inner {
    display: inline-flex;
    flex-wrap: nowrap;
    padding: 20rpx;
  }
  
  .filter-item {
    flex-shrink: 0;
    display: inline-block;
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
