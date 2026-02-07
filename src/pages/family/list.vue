<template>
  <view class="family-container">
    <!-- 家庭成员列表 -->
    <view class="member-list">
      <view class="member-item" 
            v-for="member in members" 
            :key="member.id"
            @click="editMember(member)">
        <view class="member-avatar">
          <text>{{ getAvatar(member) }}</text>
        </view>
        <view class="member-info">
          <view class="member-header">
            <text class="member-name">{{ member.name }}</text>
            <text class="member-relation">{{ getRelationName(member.relation) }}</text>
            <text class="default-tag" v-if="member.isDefault === 1">默认</text>
          </view>
          <view class="member-detail">
            <text v-if="member.gender">{{ member.gender === 1 ? '男' : '女' }}</text>
            <text v-if="member.birthdate">{{ getAge(member.birthdate) }}岁</text>
          </view>
        </view>
        <view class="member-actions">
          <text class="set-default" v-if="member.isDefault !== 1" @click.stop="setDefault(member)">设为默认</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="empty-state" v-if="!loading && members.length === 0">
        <text class="empty-icon">👨‍👩‍👧‍👦</text>
        <text class="empty-text">暂无家庭成员</text>
        <text class="empty-tip">添加家庭成员后可为家人预约挂号</text>
      </view>
    </view>

    <!-- 添加按钮 -->
    <view class="add-btn" @click="addMember">
      <text class="add-icon">+</text>
      <text class="add-text">添加家庭成员</text>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      members: [],
      loading: false
    }
  },

  onShow() {
    this.loadMembers()
  },

  methods: {
    async loadMembers() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/v1/user/family',
          method: 'GET'
        })
        if (res.code === 200) {
          this.members = res.data || []
        }
      } catch (e) {
        console.error('加载家庭成员失败', e)
      } finally {
        this.loading = false
      }
    },

    getAvatar(member) {
      const avatars = {
        'SELF': '🧑',
        'PARENT': '👴',
        'CHILD': '👶',
        'SPOUSE': '💑',
        'OTHER': '👤'
      }
      return avatars[member.relation] || '👤'
    },

    getRelationName(relation) {
      const names = {
        'SELF': '本人',
        'PARENT': '父母',
        'CHILD': '子女',
        'SPOUSE': '配偶',
        'OTHER': '其他'
      }
      return names[relation] || '其他'
    },

    getAge(birthdate) {
      if (!birthdate) return ''
      const birth = new Date(birthdate)
      const now = new Date()
      let age = now.getFullYear() - birth.getFullYear()
      const m = now.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--
      }
      return age
    },

    async setDefault(member) {
      try {
        const res = await request({
          url: `/api/v1/user/family/${member.id}/set-default`,
          method: 'POST'
        })
        if (res.code === 200) {
          uni.showToast({ title: '设置成功', icon: 'success' })
          this.loadMembers()
        }
      } catch (e) {
        uni.showToast({ title: '设置失败', icon: 'error' })
      }
    },

    addMember() {
      uni.navigateTo({ url: '/pages/family/add' })
    },

    editMember(member) {
      uni.navigateTo({ url: '/pages/family/add?id=' + member.id })
    }
  }
}
</script>

<style scoped>
.family-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 200rpx;
}

.member-list {
  padding: 30rpx;
}

.member-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.member-avatar {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
}

.member-info {
  flex: 1;
  margin-left: 24rpx;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.member-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.member-relation {
  font-size: 24rpx;
  color: #667eea;
  background: #f0f3ff;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.default-tag {
  font-size: 22rpx;
  color: #fff;
  background: #4caf50;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.member-detail {
  font-size: 26rpx;
  color: #999;
  display: flex;
  gap: 20rpx;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.set-default {
  font-size: 26rpx;
  color: #667eea;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

.add-btn {
  position: fixed;
  bottom: 60rpx;
  left: 30rpx;
  right: 30rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.4);
}

.add-icon {
  font-size: 40rpx;
  color: #fff;
  margin-right: 12rpx;
}

.add-text {
  font-size: 32rpx;
  color: #fff;
}
</style>
