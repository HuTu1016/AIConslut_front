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
        />
      </view>
    </view>
    
    <!-- 子科室直接列表展示（从首页一级科室进入） -->
    <view class="dept-list" v-if="parentId && !searchText">
      <view 
        class="dept-card" 
        v-for="dept in allDepartments" 
        :key="dept.id"
        @click="goDoctorList(dept)"
      >
        <view class="icon-wrapper">
          <text class="icon">{{ dept.icon || '🏥' }}</text>
        </view>
        <view class="info">
          <text class="name">{{ dept.name }}</text>
          <text class="desc">{{ dept.description }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="empty" v-if="allDepartments.length === 0">
        <text class="text">暂无子科室</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="dept-list" v-else-if="searchText">
      <view 
        class="dept-card" 
        v-for="dept in searchResults" 
        :key="dept.id"
        @click="goDoctorList(dept)"
      >
        <view class="icon-wrapper">
          <text class="icon">{{ dept.icon || '🏥' }}</text>
        </view>
        <view class="info">
          <text class="name">{{ dept.name }}</text>
          <text class="desc">{{ dept.description }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="empty" v-if="searchResults.length === 0">
        <text class="text">未找到相关科室</text>
      </view>
    </view>
    
    <!-- 科室分类展示（全部科室页面） -->
    <view class="dept-tree" v-else>
      <view class="category-section" v-for="category in departmentTree" :key="category.id">
        <view class="category-header" @click="toggleCategory(category.id)">
          <text class="category-icon">{{ category.icon || '🏥' }}</text>
          <text class="category-name">{{ category.name }}</text>
          <text class="category-arrow" :class="{ expanded: expandedCategories.includes(category.id) }">›</text>
        </view>
        <view class="sub-dept-list" v-show="expandedCategories.includes(category.id)">
          <view 
            class="sub-dept-item" 
            v-for="child in category.children" 
            :key="child.id"
            @click="goDoctorList(child)"
          >
            <text class="sub-icon">{{ child.icon || '🏥' }}</text>
            <view class="sub-info">
              <text class="sub-name">{{ child.name }}</text>
              <text class="sub-desc">{{ child.description }}</text>
            </view>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      searchText: '',
      departmentTree: [],
      allDepartments: [],
      expandedCategories: [],
      parentId: null,
      parentName: ''
    }
  },
  onLoad(options) {
    if (options.parentId) {
      this.parentId = parseInt(options.parentId)
      this.parentName = options.parentName || ''
      // 设置导航栏标题
      uni.setNavigationBarTitle({ title: this.parentName || '选择科室' })
    }
    this.loadDepartmentTree()
  },
  computed: {
    searchResults() {
      if (!this.searchText) return []
      const keyword = this.searchText.toLowerCase()
      return this.allDepartments.filter(dept => 
        dept.name.toLowerCase().includes(keyword) || 
        (dept.description && dept.description.toLowerCase().includes(keyword))
      )
    }
  },
  methods: {
    async loadDepartmentTree() {
      try {
        const res = await request({
          url: '/api/v1/public/departments/tree',
          method: 'GET'
        })
        if (res.code === 200 && res.data) {
          // 如果有parentId参数，只展示该父科室下的子科室
          if (this.parentId) {
            const parent = res.data.find(d => d.id === this.parentId)
            if (parent && parent.children) {
              // 直接展示子科室列表模式
              this.allDepartments = parent.children
              this.departmentTree = [] // 不使用树形展示
            }
          } else {
            // 全部科室树形展示
            this.departmentTree = res.data
            // 默认展开第一个分类
            if (this.departmentTree.length > 0) {
              this.expandedCategories = [this.departmentTree[0].id]
            }
            // 收集所有科室用于搜索
            this.allDepartments = []
            this.departmentTree.forEach(cat => {
              if (cat.children) {
                this.allDepartments.push(...cat.children)
              }
            })
          }
        }
      } catch (err) {
        console.error('加载科室失败:', err)
      }
    },
    
    toggleCategory(categoryId) {
      const index = this.expandedCategories.indexOf(categoryId)
      if (index > -1) {
        this.expandedCategories.splice(index, 1)
      } else {
        this.expandedCategories.push(categoryId)
      }
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

/* 科室树形分类样式 */
.dept-tree {
  padding: 20rpx 30rpx;
  
  .category-section {
    margin-bottom: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
  }
  
  .category-header {
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
    
    .category-icon {
      font-size: 40rpx;
      margin-right: 16rpx;
    }
    
    .category-name {
      flex: 1;
      font-size: 32rpx;
      font-weight: bold;
      color: #fff;
    }
    
    .category-arrow {
      font-size: 32rpx;
      color: #fff;
      transition: transform 0.3s;
      
      &.expanded {
        transform: rotate(90deg);
      }
    }
  }
  
  .sub-dept-list {
    .sub-dept-item {
      display: flex;
      align-items: center;
      padding: 24rpx 30rpx;
      border-bottom: 1rpx solid #F2F3F5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .sub-icon {
        font-size: 32rpx;
        margin-right: 16rpx;
      }
      
      .sub-info {
        flex: 1;
        
        .sub-name {
          display: block;
          font-size: 28rpx;
          font-weight: 500;
          color: #1D2129;
        }
        
        .sub-desc {
          display: block;
          margin-top: 6rpx;
          font-size: 22rpx;
          color: #86909C;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      
      .arrow {
        font-size: 28rpx;
        color: #C9CDD4;
      }
    }
  }
}
</style>
