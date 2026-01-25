<template>
  <view class="dept-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-box">
        <text class="icon">🔍</text>
        <input 
          class="input" 
          type="text" 
          v-model="searchText" 
          placeholder="搜索科室"
          @input="handleSearch"
        />
      </view>
    </view>
    
    <!-- 科室列表 -->
    <view class="dept-list">
      <view 
        class="dept-card" 
        v-for="dept in filteredDepartments" 
        :key="dept.id"
        @click="goDoctorList(dept)"
      >
        <view class="icon-wrapper">
          <text class="icon">{{ dept.icon }}</text>
        </view>
        <view class="info">
          <text class="name">{{ dept.name }}</text>
          <text class="desc">{{ dept.description }}</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty" v-if="filteredDepartments.length === 0">
      <text class="icon">🔍</text>
      <text class="text">未找到相关科室</text>
    </view>
  </view>
</template>

<script>
import { apiGetDepartments } from '@/utils/request.js'

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
  data() {
    return {
      searchText: '',
      departments: []
    }
  },
  onLoad() {
    this.loadDepartments()
  },
  computed: {
    filteredDepartments() {
      if (!this.searchText) {
        return this.departments
      }
      return this.departments.filter(dept => 
        dept.name.includes(this.searchText) || 
        (dept.description && dept.description.includes(this.searchText))
      )
    }
  },
  methods: {
    async loadDepartments() {
      try {
        const res = await apiGetDepartments()
        if (res.data) {
          this.departments = res.data.map(dept => ({
            ...dept,
            icon: DEPT_ICONS[dept.code] || '🏥'
          }))
        }
      } catch (err) {
        console.error('加载科室失败:', err)
      }
    },
    
    handleSearch() {
      // 搜索时自动过滤
    },
    
    goDoctorList(dept) {
      uni.navigateTo({
        url: `/pages/doctor/list?deptId=${dept.id}&deptName=${dept.name}`
      })
    }
  }
}
</script>

<style lang="scss">
.dept-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

.search-bar {
  padding: 20rpx 30rpx;
  background: #fff;
  
  .search-box {
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #F5F7FA;
    border-radius: 36rpx;
    padding: 0 24rpx;
    
    .icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }
    
    .input {
      flex: 1;
      font-size: 28rpx;
    }
  }
}

.dept-list {
  padding: 20rpx 30rpx;
  
  .dept-card {
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    
    .icon-wrapper {
      width: 80rpx;
      height: 80rpx;
      background: linear-gradient(135deg, #E8F4FC, #D0E8F5);
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .icon {
        font-size: 40rpx;
      }
    }
    
    .info {
      flex: 1;
      margin-left: 24rpx;
      
      .name {
        display: block;
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }
      
      .desc {
        display: block;
        margin-top: 8rpx;
        font-size: 24rpx;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .arrow {
      font-size: 28rpx;
      color: #ccc;
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
  }
}
</style>
