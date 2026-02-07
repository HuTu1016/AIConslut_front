<template>
  <view class="health-container">
    <!-- 功能模块 -->
    <view class="module-list">
      <!-- 体检报告 -->
      <view class="module-item" @click="goToReports">
        <view class="module-icon report-icon">
          <text class="iconfont">📋</text>
        </view>
        <view class="module-info">
          <text class="module-title">体检报告</text>
          <text class="module-desc">{{ summary.recentReports?.length || 0 }}份报告</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <!-- 病史记录 -->
      <view class="module-item" @click="goToHistory">
        <view class="module-icon history-icon">
          <text class="iconfont">📝</text>
        </view>
        <view class="module-info">
          <text class="module-title">病史记录</text>
          <text class="module-desc">{{ summary.medicalHistory?.length || 0 }}条记录</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <!-- 用药记录 -->
      <view class="module-item" @click="goToMedications">
        <view class="module-icon medication-icon">
          <text class="iconfont">💊</text>
        </view>
        <view class="module-info">
          <text class="module-title">用药记录</text>
          <text class="module-desc">{{ summary.activeMedications?.length || 0 }}种药物使用中</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <!-- 过敏史 -->
      <view class="module-item" @click="goToAllergies">
        <view class="module-icon allergy-icon">
          <text class="iconfont">⚠️</text>
        </view>
        <view class="module-info">
          <text class="module-title">过敏记录</text>
          <text class="module-desc">{{ summary.allergies?.length || 0 }}项过敏原</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 最近体检报告 -->
    <view class="section" v-if="summary.recentReports?.length">
      <view class="section-header">
        <text class="section-title">最近体检报告</text>
        <text class="more" @click="goToReports">查看全部</text>
      </view>
      <view class="report-list">
        <view class="report-item" v-for="report in summary.recentReports" :key="report.id" @click="viewReport(report)">
          <view class="report-icon">
            <text>{{ getReportIcon(report.fileType) }}</text>
          </view>
          <view class="report-info">
            <text class="report-name">{{ report.reportName }}</text>
            <text class="report-date">{{ report.reportDate }} · {{ report.hospital || '未知医院' }}</text>
          </view>
          <view class="report-status" v-if="report.aiAnalysis">
            <text class="analyzed">已解读</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 当前用药 -->
    <view class="section" v-if="summary.activeMedications?.length">
      <view class="section-header">
        <text class="section-title">当前用药</text>
        <text class="more" @click="goToMedications">查看全部</text>
      </view>
      <view class="medication-list">
        <view class="medication-item" v-for="med in summary.activeMedications" :key="med.id">
          <view class="med-info">
            <text class="med-name">{{ med.medicineName }}</text>
            <text class="med-dosage">{{ med.dosage }} · {{ med.frequency }}</text>
          </view>
          <view class="med-purpose">
            <text>{{ med.purpose }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 过敏提醒 -->
    <view class="allergy-alert" v-if="summary.allergies?.length">
      <view class="alert-header">
        <text class="alert-icon">⚠️</text>
        <text class="alert-title">过敏提醒</text>
      </view>
      <view class="allergy-tags">
        <text class="allergy-tag" v-for="allergy in summary.allergies" :key="allergy.id" 
              :class="'severity-' + allergy.severity?.toLowerCase()">
          {{ allergy.allergen }}
        </text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-btn" @click="uploadReport">
        <text class="btn-icon">📤</text>
        <text class="btn-text">上传报告</text>
      </view>
      <view class="action-btn" @click="addHistory">
        <text class="btn-icon">➕</text>
        <text class="btn-text">添加病史</text>
      </view>
      <view class="action-btn" @click="addMedication">
        <text class="btn-icon">💊</text>
        <text class="btn-text">添加用药</text>
      </view>
      <view class="action-btn" @click="addAllergy">
        <text class="btn-icon">⚠️</text>
        <text class="btn-text">添加过敏</text>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      summary: {
        recentReports: [],
        medicalHistory: [],
        activeMedications: [],
        allergies: []
      },
      loading: false
    }
  },

  onShow() {
    this.loadSummary()
  },

  methods: {

    async loadSummary() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/v1/user/health/summary',
          method: 'GET'
        })
        if (res.code === 200) {
          this.summary = res.data
        }
      } catch (e) {
        console.error('加载健康档案失败', e)
      } finally {
        this.loading = false
      }
    },

    getReportIcon(fileType) {
      const icons = {
        'pdf': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️'
      }
      return icons[fileType] || '📋'
    },

    goToReports() {
      // 滚动到体检报告区域或显示报告列表弹窗
      if (this.summary.recentReports?.length) {
        uni.showActionSheet({
          itemList: ['上传新报告', '查看全部报告'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.uploadReport()
            }
          }
        })
      } else {
        this.uploadReport()
      }
    },

    goToHistory() {
      if (this.summary.medicalHistory?.length) {
        uni.showActionSheet({
          itemList: ['添加病史记录'],
          success: () => this.addHistory()
        })
      } else {
        this.addHistory()
      }
    },

    goToMedications() {
      if (this.summary.activeMedications?.length) {
        uni.showActionSheet({
          itemList: ['添加用药记录'],
          success: () => this.addMedication()
        })
      } else {
        this.addMedication()
      }
    },

    goToAllergies() {
      if (this.summary.allergies?.length) {
        uni.showActionSheet({
          itemList: ['添加过敏记录'],
          success: () => this.addAllergy()
        })
      } else {
        this.addAllergy()
      }
    },

    viewReport(report) {
      uni.showModal({
        title: report.reportName,
        content: report.aiAnalysis || '暂无AI解读，点击确定开始解读',
        confirmText: report.aiAnalysis ? '关闭' : '开始解读',
        success: async (res) => {
          if (res.confirm && !report.aiAnalysis) {
            this.analyzeReport(report.id)
          }
        }
      })
    },

    async analyzeReport(reportId) {
      uni.showLoading({ title: 'AI解读中...' })
      try {
        const res = await request({
          url: `/api/v1/user/health/reports/${reportId}/analyze`,
          method: 'POST'
        })
        if (res.code === 200) {
          uni.hideLoading()
          uni.showModal({
            title: 'AI解读结果',
            content: res.data,
            showCancel: false
          })
          this.loadSummary()
        }
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '解读失败', icon: 'error' })
      }
    },

    uploadReport() {
      uni.navigateTo({ url: '/pages/health/report-upload' })
    },

    addHistory() {
      uni.navigateTo({ url: '/pages/health/history-add' })
    },

    addMedication() {
      uni.navigateTo({ url: '/pages/health/medication-add' })
    },

    addAllergy() {
      uni.navigateTo({ url: '/pages/health/allergy-add' })
    }
  }
}
</script>

<style scoped>
.health-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}

/* 个人信息卡片样式 */
.module-list {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.module-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.module-item:last-child {
  border-bottom: none;
}

.module-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.report-icon { background: #e8f5e9; }
.history-icon { background: #fff3e0; }
.medication-icon { background: #e3f2fd; }
.allergy-icon { background: #ffebee; }

.module-info {
  flex: 1;
  margin-left: 24rpx;
}

.module-title {
  font-size: 32rpx;
  color: #333;
  display: block;
}

.module-desc {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 26rpx;
  color: #667eea;
}

.report-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.report-item:last-child {
  border-bottom: none;
}

.report-item .report-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.report-info {
  flex: 1;
}

.report-name {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.report-date {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.analyzed {
  font-size: 22rpx;
  color: #4caf50;
  background: #e8f5e9;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.medication-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.medication-item:last-child {
  border-bottom: none;
}

.med-name {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.med-dosage {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.med-purpose {
  font-size: 24rpx;
  color: #667eea;
  background: #f0f3ff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.allergy-alert {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  border-left: 8rpx solid #ff9800;
}

.alert-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.alert-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.alert-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #ff9800;
}

.allergy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.allergy-tag {
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  background: #fff3e0;
  color: #ff9800;
}

.severity-mild { background: #e8f5e9; color: #4caf50; }
.severity-moderate { background: #fff3e0; color: #ff9800; }
.severity-severe { background: #ffebee; color: #f44336; }

.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 40rpx 30rpx;
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #666;
}
</style>
