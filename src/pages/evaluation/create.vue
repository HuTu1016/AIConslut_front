<template>
  <view class="evaluation-container">
    <!-- 医生信息 -->
    <view class="doctor-card" v-if="appointment">
      <image class="doctor-avatar" :src="appointment.doctorAvatar || '/static/default-avatar.png'" mode="aspectFill" />
      <view class="doctor-info">
        <text class="doctor-name">{{ appointment.doctorName }}</text>
        <text class="doctor-dept">{{ appointment.departmentName }}</text>
      </view>
    </view>

    <!-- 评分区域 -->
    <view class="rating-section">
      <view class="rating-item">
        <text class="rating-label">综合评分</text>
        <view class="stars">
          <text class="star" 
                v-for="i in 5" 
                :key="i"
                :class="{ active: form.overallScore >= i }"
                @click="form.overallScore = i">
            {{ form.overallScore >= i ? '★' : '☆' }}
          </text>
        </view>
        <text class="rating-text">{{ getRatingText(form.overallScore) }}</text>
      </view>

      <view class="rating-item">
        <text class="rating-label">服务态度</text>
        <view class="stars small">
          <text class="star" 
                v-for="i in 5" 
                :key="i"
                :class="{ active: form.attitudeScore >= i }"
                @click="form.attitudeScore = i">
            {{ form.attitudeScore >= i ? '★' : '☆' }}
          </text>
        </view>
      </view>

      <view class="rating-item">
        <text class="rating-label">专业水平</text>
        <view class="stars small">
          <text class="star" 
                v-for="i in 5" 
                :key="i"
                :class="{ active: form.professionalScore >= i }"
                @click="form.professionalScore = i">
            {{ form.professionalScore >= i ? '★' : '☆' }}
          </text>
        </view>
      </view>

      <view class="rating-item">
        <text class="rating-label">响应速度</text>
        <view class="stars small">
          <text class="star" 
                v-for="i in 5" 
                :key="i"
                :class="{ active: form.responseScore >= i }"
                @click="form.responseScore = i">
            {{ form.responseScore >= i ? '★' : '☆' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 标签选择 -->
    <view class="tags-section">
      <text class="section-title">选择标签</text>
      <view class="tag-list">
        <view class="tag-item" 
              v-for="tag in tagOptions" 
              :key="tag"
              :class="{ active: selectedTags.includes(tag) }"
              @click="toggleTag(tag)">
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 评价内容 -->
    <view class="content-section">
      <text class="section-title">评价内容</text>
      <textarea class="content-input" 
                v-model="form.content" 
                placeholder="分享您的就诊体验，帮助更多人了解这位医生..."
                maxlength="500" />
      <text class="word-count">{{ form.content.length }}/500</text>
    </view>

    <!-- 匿名选项 -->
    <view class="anonymous-section">
      <view class="switch-row">
        <text class="switch-label">匿名评价</text>
        <switch :checked="form.isAnonymous" @change="onAnonymousChange" color="#667eea" />
      </view>
      <text class="anonymous-tip">匿名后您的昵称将显示为"匿名用户"</text>
    </view>

    <!-- 提交按钮 -->
    <view class="btn-area">
      <button class="submit-btn" :loading="submitting" @click="submit">
        {{ submitting ? '提交中...' : '提交评价' }}
      </button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      appointmentId: null,
      appointment: null,
      form: {
        overallScore: 5,
        attitudeScore: 5,
        professionalScore: 5,
        responseScore: 5,
        content: '',
        isAnonymous: false
      },
      selectedTags: [],
      tagOptions: [
        '专业细致',
        '态度很好',
        '耐心解答',
        '经验丰富',
        '回复及时',
        '诊断准确',
        '用药合理',
        '值得推荐'
      ],
      submitting: false
    }
  },

  onLoad(options) {
    if (options.appointmentId) {
      this.appointmentId = options.appointmentId
      this.loadAppointment()
    }
  },

  methods: {
    async loadAppointment() {
      try {
        const res = await request({
          url: `/api/v1/user/appointments/${this.appointmentId}`,
          method: 'GET'
        })
        if (res.code === 200) {
          this.appointment = res.data
        }
      } catch (e) {
        console.error('加载预约信息失败', e)
      }
    },

    getRatingText(score) {
      const texts = ['', '很差', '较差', '一般', '满意', '非常满意']
      return texts[score] || ''
    },

    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      if (index > -1) {
        this.selectedTags.splice(index, 1)
      } else {
        if (this.selectedTags.length < 5) {
          this.selectedTags.push(tag)
        } else {
          uni.showToast({ title: '最多选择5个标签', icon: 'none' })
        }
      }
    },

    onAnonymousChange(e) {
      this.form.isAnonymous = e.detail.value
    },

    async submit() {
      if (!this.form.overallScore) {
        uni.showToast({ title: '请选择综合评分', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        const res = await request({
          url: '/api/v1/user/evaluations',
          method: 'POST',
          data: {
            appointmentId: this.appointmentId,
            overallScore: this.form.overallScore,
            attitudeScore: this.form.attitudeScore,
            professionalScore: this.form.professionalScore,
            responseScore: this.form.responseScore,
            content: this.form.content,
            tags: JSON.stringify(this.selectedTags),
            isAnonymous: this.form.isAnonymous
          }
        })

        if (res.code === 200) {
          uni.showToast({ title: '评价成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.message || '评价失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '评价失败', icon: 'error' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.evaluation-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 200rpx;
}

.doctor-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 30rpx;
  margin: 30rpx;
  border-radius: 20rpx;
}

.doctor-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.doctor-info {
  margin-left: 24rpx;
}

.doctor-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.doctor-dept {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.rating-section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.rating-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.rating-item:last-child {
  border-bottom: none;
}

.rating-label {
  font-size: 28rpx;
  color: #333;
  width: 160rpx;
}

.stars {
  display: flex;
  gap: 16rpx;
  flex: 1;
}

.stars.small .star {
  font-size: 36rpx;
}

.star {
  font-size: 48rpx;
  color: #ddd;
  transition: all 0.2s;
}

.star.active {
  color: #ffc107;
}

.rating-text {
  font-size: 26rpx;
  color: #667eea;
  width: 120rpx;
  text-align: right;
}

.tags-section, .content-section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  font-size: 26rpx;
  color: #666;
  padding: 14rpx 28rpx;
  background: #f5f7fa;
  border-radius: 30rpx;
  transition: all 0.3s;
}

.tag-item.active {
  color: #667eea;
  background: #f0f3ff;
  border: 1rpx solid #667eea;
}

.content-input {
  width: 100%;
  min-height: 200rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.word-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  display: block;
  margin-top: 12rpx;
}

.anonymous-section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-label {
  font-size: 28rpx;
  color: #333;
}

.anonymous-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
  display: block;
}

.btn-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
