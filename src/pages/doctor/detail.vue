<template>
  <view class="detail-container">
    <!-- 返回按钮 -->

    
    <!-- 医生信息卡片 -->
    <view class="doctor-card">
      <view class="basic-info">
        <image 
          class="avatar" 
          :src="doctor.avatarUrl || '/static/default-avatar.png'" 
          mode="aspectFill"
        ></image>
        <view class="info">
          <view class="name-row">
            <text class="name">{{ doctor.name }}</text>
            <text class="title">{{ doctor.title }}</text>
          </view>
          <text class="dept">{{ doctor.departmentName }}</text>
          <view class="rating-row">
            <text class="star">⭐</text>
            <text class="score">{{ doctor.rating }}</text>
            <text class="consult-count">接诊量 {{ doctor.consultCount || 1000 }}+</text>
          </view>
        </view>
      </view>
      <view class="price-row">
        <text class="label">问诊费用</text>
        <text class="price">¥{{ doctor.consultPrice }}</text>
      </view>
    </view>
    
    <!-- 医生简介 -->
    <view class="section">
      <view class="section-title">医生简介</view>
      <view class="section-content">
        <text class="intro">{{ doctor.introduction }}</text>
      </view>
    </view>
    
    <!-- 擅长领域 -->
    <view class="section">
      <view class="section-title">擅长领域</view>
      <view class="section-content">
        <view class="tags">
          <text class="tag" v-for="(tag, i) in doctor.specialties" :key="i">{{ tag }}</text>
        </view>
      </view>
    </view>
    
    <!-- 排班信息 -->
    <view class="section">
      <view class="section-title">排班信息</view>
      <view class="section-content">
        <!-- 日期选择 -->
        <scroll-view class="date-scroll" scroll-x>
          <view 
            class="date-item" 
            v-for="(date, i) in dateList" 
            :key="i"
            :class="{ active: selectedDate === date.value, disabled: !date.available }"
            @click="date.available && selectDate(date.value)"
          >
            <text class="week">{{ date.week }}</text>
            <text class="day">{{ date.day }}</text>
            <text class="status">{{ date.available ? '有号' : '约满' }}</text>
          </view>
        </scroll-view>
        
        <!-- 时段选择 -->
        <view class="shift-list" v-if="selectedDate">
          <view 
            class="shift-item"
            v-for="shift in currentShifts"
            :key="shift.id"
            :class="{ active: selectedShift === shift.id, disabled: shift.usedQuota >= shift.quota }"
            @click="shift.usedQuota < shift.quota && selectShift(shift.id)"
          >
            <text class="time">{{ shift.shiftName }} {{ shift.startTime }}-{{ shift.endTime }}</text>
            <text class="quota">剩余{{ shift.quota - shift.usedQuota }}号</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="book-btn" @click="handleBook" :disabled="!canBook">
        {{ canBook ? '立即预约' : '请选择时段' }}
      </button>
    </view>
  </view>
</template>

<script>
import { checkLogin } from '@/utils/store.js'
import { apiGetDoctorDetail, apiGetDoctorSchedules } from '@/utils/request.js'

export default {
  data() {
    return {
      doctorId: '',
      doctor: {
        id: 0,
        name: '',
        title: '',
        departmentName: '',
        introduction: '',
        consultPrice: 0,
        rating: 0,
        avatarUrl: '',
        specialties: []
      },
      dateList: [],
      schedules: [],
      selectedDate: '',
      selectedShift: ''
    }
  },
  computed: {
    currentShifts() {
      return this.schedules.filter(s => s.scheduleDate === this.selectedDate)
    },
    canBook() {
      return this.selectedDate && this.selectedShift
    }
  },
  onLoad(options) {
    if (options.id) {
      this.doctorId = options.id
      this.loadDoctorInfo()
      this.loadSchedules()
    }
    this.initDateList()
  },
  methods: {
    // 加载医生详情
    async loadDoctorInfo() {
      try {
        const res = await apiGetDoctorDetail(this.doctorId)
        if (res.data) {
          this.doctor = {
            ...res.data,
            specialties: res.data.specialties || []
          }
        }
      } catch (err) {
        console.error('加载医生信息失败:', err)
      }
    },
    
    // 加载排班信息
    async loadSchedules() {
      try {
        const res = await apiGetDoctorSchedules(this.doctorId)
        if (res.data) {
          // 转换排班数据格式
          const shiftNames = { 1: '上午', 2: '下午', 3: '晚间' }
          this.schedules = res.data.map(s => ({
            ...s,
            shiftName: shiftNames[s.shiftType] || '全天',
            startTime: s.startTime ? s.startTime.substring(0, 5) : '',
            endTime: s.endTime ? s.endTime.substring(0, 5) : ''
          }))
          
          // 更新日期列表的可用状态
          this.updateDateAvailability()
        }
      } catch (err) {
        console.error('加载排班失败:', err)
      }
    },
    
    initDateList() {
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const today = new Date()
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        
        const month = date.getMonth() + 1
        const day = date.getDate()
        const value = `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        this.dateList.push({
          value,
          week: i === 0 ? '今天' : (i === 1 ? '明天' : weekNames[date.getDay()]),
          day: `${month}/${day}`,
          available: false // 默认无号，后续根据排班数据更新
        })
      }
    },
    
    // 根据排班数据更新日期可用状态
    updateDateAvailability() {
      this.dateList.forEach(date => {
        const daySchedules = this.schedules.filter(s => s.scheduleDate === date.value)
        date.available = daySchedules.some(s => s.usedQuota < s.quota && s.status === 1)
      })
      
      // 默认选中第一个有号的日期
      const firstAvailable = this.dateList.find(d => d.available)
      if (firstAvailable) {
        this.selectedDate = firstAvailable.value
      }
    },
    
    selectDate(date) {
      this.selectedDate = date
      this.selectedShift = ''
    },
    
    selectShift(shiftId) {
      this.selectedShift = shiftId
    },
    
    handleBook() {
      if (!checkLogin()) return
      
      if (!this.canBook) {
        uni.showToast({ title: '请选择就诊时段', icon: 'none' })
        return
      }
      
      // 获取选中的排班信息
      const selectedSchedule = this.schedules.find(s => s.id === this.selectedShift)
      const timeStr = selectedSchedule 
        ? `${selectedSchedule.shiftName} ${selectedSchedule.startTime}-${selectedSchedule.endTime}` 
        : ''
      
      uni.navigateTo({
        url: `/pages/appointment/book?doctorId=${this.doctorId}&scheduleId=${this.selectedShift}&date=${this.selectedDate}&time=${encodeURIComponent(timeStr)}`
      })
    }
  }
}
</script>

<style lang="scss">
.detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 160rpx;
}

.doctor-card {
  background: #fff;
  padding: 30rpx;
  
  .basic-info {
    display: flex;
    
    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 20rpx;
      background: #f0f0f0;
    }
    
    .info {
      flex: 1;
      margin-left: 24rpx;
      
      .name-row {
        display: flex;
        align-items: center;
        
        .name {
          font-size: 40rpx;
          font-weight: bold;
          color: #333;
        }
        
        .title {
          margin-left: 16rpx;
          font-size: 26rpx;
          color: #4A90D9;
          background: rgba(74, 144, 217, 0.1);
          padding: 6rpx 16rpx;
          border-radius: 8rpx;
        }
      }
      
      .dept {
        display: block;
        margin-top: 12rpx;
        font-size: 28rpx;
        color: #666;
      }
      
      .rating-row {
        display: flex;
        align-items: center;
        margin-top: 12rpx;
        
        .star {
          font-size: 26rpx;
        }
        
        .score {
          margin-left: 4rpx;
          font-size: 28rpx;
          color: #E8A87C;
          font-weight: bold;
        }
        
        .consult-count {
          margin-left: 24rpx;
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
  
  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f0f0f0;
    
    .label {
      font-size: 28rpx;
      color: #666;
    }
    
    .price {
      font-size: 36rpx;
      font-weight: bold;
      color: #E8A87C;
    }
  }
}

.section {
  margin-top: 20rpx;
  background: #fff;
  padding: 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    position: relative;
    padding-left: 20rpx;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6rpx;
      width: 6rpx;
      height: 30rpx;
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
      border-radius: 3rpx;
    }
  }
  
  .section-content {
    .intro {
      font-size: 28rpx;
      color: #666;
      line-height: 1.8;
    }
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      
      .tag {
        padding: 10rpx 24rpx;
        font-size: 26rpx;
        color: #4A90D9;
        background: rgba(74, 144, 217, 0.1);
        border-radius: 20rpx;
      }
    }
  }
}

.date-scroll {
  white-space: nowrap;
  
  .date-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: 120rpx;
    padding: 20rpx 0;
    margin-right: 16rpx;
    background: #F5F7FA;
    border-radius: 12rpx;
    
    &.active {
      background: linear-gradient(135deg, #4A90D9, #67B8DE);
      
      .week, .day, .status {
        color: #fff;
      }
    }
    
    &.disabled {
      opacity: 0.5;
    }
    
    .week {
      font-size: 24rpx;
      color: #666;
    }
    
    .day {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin: 8rpx 0;
    }
    
    .status {
      font-size: 22rpx;
      color: #4A90D9;
    }
  }
}

.shift-list {
  margin-top: 24rpx;
  
  .shift-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    background: #F5F7FA;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    border: 2rpx solid transparent;
    
    &.active {
      border-color: #4A90D9;
      background: rgba(74, 144, 217, 0.1);
    }
    
    &.disabled {
      opacity: 0.5;
      
      .quota {
        color: #E74C3C;
      }
    }
    
    .time {
      font-size: 28rpx;
      color: #333;
    }
    
    .quota {
      font-size: 26rpx;
      color: #4A90D9;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  .book-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    color: #fff;
    background: linear-gradient(135deg, #4A90D9, #67B8DE);
    border-radius: 44rpx;
    
    &[disabled] {
      background: #ccc;
    }
    
    &::after {
      border: none;
    }
  }
}
</style>
