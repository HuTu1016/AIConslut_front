<template>
  <view class="record-container">
    <!-- 返回按钮 -->

    
    <!-- 问诊信息 -->
    <view class="header-card">
      <view class="doctor-info">
        <image class="avatar" :src="$resolveImage(record.doctorAvatar)" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ record.doctorName }}</text>
          <text class="dept">{{ record.departmentName }}</text>
        </view>
      </view>
      <text class="time">{{ record.createdAt }}</text>
    </view>
    
    <!-- 患者信息 -->
    <view class="section">
      <view class="section-title">
        <text class="icon">👤</text>
        <text>患者信息</text>
      </view>
      <view class="section-content patient-info">
        <view class="info-row">
          <text class="label">姓名：</text>
          <text class="value">{{ patient.patientName || '--' }}</text>
        </view>
        <view class="info-row" v-if="patient.gender">
          <text class="label">性别：</text>
          <text class="value">{{ patient.gender === 1 ? '男' : patient.gender === 2 ? '女' : '--' }}</text>
        </view>
        <view class="info-row" v-if="patient.age">
          <text class="label">年龄：</text>
          <text class="value">{{ patient.age }}岁</text>
        </view>
        <view class="info-row" v-if="patient.phone">
          <text class="label">联系方式：</text>
          <text class="value">{{ patient.phone }}</text>
        </view>
      </view>
    </view>
    
    <!-- 主诉 -->
    <view class="section">
      <view class="section-title">
        <text class="icon">📝</text>
        <text>主诉</text>
      </view>
      <view class="section-content">
        <text>{{ record.chiefComplaint || patient.symptomDescription || '暂无' }}</text>
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
import { apiGetConsultRecord, apiGetAppointmentDetail } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: '',
      record: {
        doctorName: '',
        doctorAvatar: '',
        departmentName: '',
        chiefComplaint: '',
        diagnosis: '',
        prescription: '',
        aiAnalysis: '',
        createdAt: ''
      },
      patient: {
        patientName: '',
        gender: null,
        age: null,
        phone: '',
        symptomDescription: ''
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
        // 获取问诊记录
        const res = await apiGetConsultRecord(this.appointmentId)
        if (res.code === 200 && res.data) {
          Object.assign(this.record, res.data)
        }
        // 获取预约详情中的医生信息和患者信息
        const apptRes = await apiGetAppointmentDetail(this.appointmentId)
        if (apptRes.code === 200 && apptRes.data) {
          const data = apptRes.data
          this.record.doctorName = data.doctorName || '医生'
          this.record.doctorAvatar = data.doctorAvatar || ''
          this.record.departmentName = data.departmentName || ''
          // 患者信息
          this.patient.patientName = data.patientName || ''
          this.patient.phone = data.patientPhone || ''
          this.patient.symptomDescription = data.symptomDescription || ''
          // 如果有用户详细信息
          if (data.userInfo) {
            this.patient.gender = data.userInfo.gender
            this.patient.age = this.calcAge(data.userInfo.birthdate)
          }
        }
      } catch (err) {
        console.error('加载病历失败:', err)
      }
    },
    calcAge(birthdate) {
      if (!birthdate) return null
      const birth = new Date(birthdate)
      const now = new Date()
      let age = now.getFullYear() - birth.getFullYear()
      const m = now.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
      return age
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
    
    &.patient-info {
      .info-row {
        display: flex;
        padding: 8rpx 0;
        border-bottom: 1rpx solid #f0f0f0;
        &:last-child { border-bottom: none; }
        .label {
          color: #999;
          width: 160rpx;
          flex-shrink: 0;
        }
        .value {
          color: #333;
          flex: 1;
        }
      }
    }
    
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
