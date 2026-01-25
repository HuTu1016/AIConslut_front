<template>
  <view class="record-container">
    <!-- 问诊信息 -->
    <view class="header-card">
      <view class="doctor-info">
        <image class="avatar" :src="record.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ record.doctorName }}</text>
          <text class="dept">{{ record.departmentName }}</text>
        </view>
      </view>
      <text class="time">{{ record.createdAt }}</text>
    </view>
    
    <!-- 主诉 -->
    <view class="section">
      <view class="section-title">
        <text class="icon">📝</text>
        <text>主诉</text>
      </view>
      <view class="section-content">
        <text>{{ record.chiefComplaint }}</text>
      </view>
    </view>
    
    <!-- 诊断结果 -->
    <view class="section">
      <view class="section-title">
        <text class="icon">🔍</text>
        <text>诊断结果</text>
      </view>
      <view class="section-content">
        <text>{{ record.diagnosis }}</text>
      </view>
    </view>
    
    <!-- 处方建议 -->
    <view class="section">
      <view class="section-title">
        <text class="icon">💊</text>
        <text>处方建议</text>
      </view>
      <view class="section-content prescription">
        <text>{{ record.prescription }}</text>
      </view>
    </view>
    
    <!-- AI分析 -->
    <view class="section" v-if="record.aiAnalysis">
      <view class="section-title">
        <text class="icon">🤖</text>
        <text>AI辅助分析</text>
      </view>
      <view class="section-content ai-analysis">
        <text>{{ record.aiAnalysis }}</text>
      </view>
    </view>
    
    <!-- 温馨提示 -->
    <view class="tips">
      <text class="title">温馨提示</text>
      <text class="content">• 本病历仅供参考，如有严重不适请及时就医</text>
      <text class="content">• 请按医嘱用药，如有不良反应请及时联系医生</text>
    </view>
  </view>
</template>

<script>
import { apiGetConsultRecord } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: '',
      record: {
        id: 1,
        appointmentId: 1,
        doctorName: '张伟明',
        doctorAvatar: '',
        departmentName: '神经内科',
        chiefComplaint: '间歇性头痛一周，伴恶心',
        diagnosis: '偏头痛（疑似）',
        prescription: '1. 布洛芬缓释胶囊 0.3g 每日2次\n2. 建议做头部CT检查',
        aiAnalysis: 'AI分析：根据症状描述，偏头痛可能性较大(75%)，紧张性头痛可能性(20%)，需排除器质性病变',
        createdAt: '2026-01-25 11:30'
      }
    }
  },
  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
      this.loadRecord()
    }
  },
  methods: {
    async loadRecord() {
      try {
        // const res = await apiGetConsultRecord(this.appointmentId)
        // this.record = res.data
      } catch (err) {
        console.error('加载病历失败:', err)
      }
    }
  }
}
</script>

<style lang="scss">
.record-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 40rpx;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
  
  .doctor-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
    }
    
    .info {
      margin-left: 20rpx;
      
      .name {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #fff;
      }
      
      .dept {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 4rpx;
      }
    }
  }
  
  .time {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .section-title {
    display: flex;
    align-items: center;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    
    .icon {
      margin-right: 12rpx;
      font-size: 32rpx;
    }
  }
  
  .section-content {
    font-size: 28rpx;
    color: #666;
    line-height: 1.8;
    white-space: pre-wrap;
    
    &.prescription {
      padding: 20rpx;
      background: #F5F7FA;
      border-radius: 12rpx;
    }
    
    &.ai-analysis {
      padding: 20rpx;
      background: rgba(74, 144, 217, 0.1);
      border-radius: 12rpx;
      color: #4A90D9;
    }
  }
}

.tips {
  margin: 20rpx;
  padding: 24rpx;
  background: rgba(232, 168, 124, 0.1);
  border-radius: 12rpx;
  
  .title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #E8A87C;
    margin-bottom: 12rpx;
  }
  
  .content {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.8;
  }
}
</style>
