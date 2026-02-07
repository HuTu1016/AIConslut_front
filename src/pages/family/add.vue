<template>
  <view class="add-container">
    <view class="form-section">
      <view class="form-item">
        <text class="label required">姓名</text>
        <input class="input" v-model="form.name" placeholder="请输入真实姓名" />
      </view>

      <view class="form-item">
        <text class="label required">与您的关系</text>
        <view class="relation-options">
          <view class="relation-item" 
                v-for="item in relationList" 
                :key="item.value"
                :class="{ active: form.relation === item.value }"
                @click="form.relation = item.value">
            <text class="relation-icon">{{ item.icon }}</text>
            <text class="relation-name">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-options">
          <view class="gender-item" 
                :class="{ active: form.gender === 1 }"
                @click="form.gender = 1">
            <text>👨 男</text>
          </view>
          <view class="gender-item" 
                :class="{ active: form.gender === 2 }"
                @click="form.gender = 2">
            <text>👩 女</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">出生日期</text>
        <picker mode="date" :value="form.birthdate" @change="onDateChange">
          <view class="picker-value">
            {{ form.birthdate || '请选择日期' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" v-model="form.phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>

      <view class="form-item">
        <text class="label">身份证号</text>
        <input class="input" v-model="form.idCard" placeholder="请输入身份证号" maxlength="18" />
      </view>

      <view class="form-item">
        <view class="switch-row">
          <text class="label">设为默认就诊人</text>
          <switch :checked="form.isDefault === 1" @change="onDefaultChange" color="#667eea" />
        </view>
      </view>
    </view>

    <view class="btn-area">
      <button class="delete-btn" v-if="isEdit" @click="deleteMember">删除成员</button>
      <button class="submit-btn" :loading="submitting" @click="submit">
        {{ submitting ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      form: {
        name: '',
        relation: 'SELF',
        gender: null,
        birthdate: '',
        phone: '',
        idCard: '',
        isDefault: 0
      },
      relationList: [
        { value: 'SELF', label: '本人', icon: '🧑' },
        { value: 'PARENT', label: '父母', icon: '👴' },
        { value: 'CHILD', label: '子女', icon: '👶' },
        { value: 'SPOUSE', label: '配偶', icon: '💑' },
        { value: 'OTHER', label: '其他', icon: '👤' }
      ],
      isEdit: false,
      memberId: null,
      submitting: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.isEdit = true
      this.memberId = options.id
      this.loadMember()
    }
  },

  methods: {
    async loadMember() {
      try {
        const res = await request({
          url: `/api/v1/user/family/${this.memberId}`,
          method: 'GET'
        })
        if (res.code === 200 && res.data) {
          this.form = {
            name: res.data.name || '',
            relation: res.data.relation || 'SELF',
            gender: res.data.gender,
            birthdate: res.data.birthdate || '',
            phone: res.data.phone || '',
            idCard: res.data.idCard || '',
            isDefault: res.data.isDefault || 0
          }
        }
      } catch (e) {
        console.error('加载成员信息失败', e)
      }
    },

    onDateChange(e) {
      this.form.birthdate = e.detail.value
    },

    onDefaultChange(e) {
      this.form.isDefault = e.detail.value ? 1 : 0
    },

    async submit() {
      if (!this.form.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' })
        return
      }
      if (!this.form.relation) {
        uni.showToast({ title: '请选择与您的关系', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        let res
        if (this.isEdit) {
          res = await request({
            url: `/api/v1/user/family/${this.memberId}`,
            method: 'PUT',
            data: this.form
          })
        } else {
          res = await request({
            url: '/api/v1/user/family',
            method: 'POST',
            data: this.form
          })
        }

        if (res.code === 200) {
          uni.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.message || '保存失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'error' })
      } finally {
        this.submitting = false
      }
    },

    async deleteMember() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该家庭成员吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await request({
                url: `/api/v1/user/family/${this.memberId}`,
                method: 'DELETE'
              })
              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' })
                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)
              }
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'error' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.add-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 200rpx;
}

.form-section {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.required::before {
  content: '*';
  color: #f44336;
  margin-right: 8rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker-value {
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #333;
}

.arrow {
  color: #ccc;
  font-size: 32rpx;
}

.relation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.relation-item {
  width: calc(33.33% - 14rpx);
  height: 120rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.relation-item.active {
  background: #f0f3ff;
  border: 2rpx solid #667eea;
}

.relation-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.relation-name {
  font-size: 26rpx;
  color: #333;
}

.gender-options {
  display: flex;
  gap: 20rpx;
}

.gender-item {
  flex: 1;
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s;
}

.gender-item.active {
  background: #f0f3ff;
  border: 2rpx solid #667eea;
  color: #667eea;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-row .label {
  margin-bottom: 0;
}

.btn-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  display: flex;
  gap: 20rpx;
}

.delete-btn {
  flex: 1;
  height: 96rpx;
  background: #fff;
  color: #f44336;
  font-size: 32rpx;
  border: 2rpx solid #f44336;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn {
  flex: 2;
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
