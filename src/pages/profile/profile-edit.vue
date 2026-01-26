<template>
  <view class="profile-edit-container" @click="exitEditMode">
    <!-- 档案信息区域 -->
    <view class="avatar-section">
      <image class="avatar" :src="form.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="info-text">
        <text class="nickname">{{ form.nickname || '未设置昵称' }}</text>
        <text class="sub-info">{{ genderText }} | {{ calculateAge(form.birthdate) }}</text>
      </view>
    </view>

    <!-- 基础信息 -->
    <view class="section">
      <view class="section-title">基础信息</view>
      <view class="form-group">
        <view class="form-item">
          <text class="label">昵称</text>
          <input class="input" v-model="form.nickname" placeholder="请输入昵称" />
        </view>
        <view class="form-item">
          <text class="label">真实姓名</text>
          <input class="input" v-model="form.realName" placeholder="请输入真实姓名" />
        </view>
        <view class="form-item" @click="showGenderPicker = true">
          <text class="label">性别</text>
          <text class="value">{{ genderText }}</text>
          <text class="arrow">›</text>
        </view>
        <view class="form-item" @click="showDatePicker = true">
          <text class="label">出生日期</text>
          <text class="value">{{ form.birthdate || '请选择' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 所在地区 -->
    <view class="section">
      <view class="section-title">所在地区</view>
      <view class="form-group">
        <view class="form-item" @click="showRegionPicker = true">
          <text class="label">省/市/区</text>
          <text class="value">{{ regionText }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 身体指标 -->
    <view class="section">
      <view class="section-title">身体指标</view>
      <view class="form-group">
        <view class="form-item">
          <text class="label">身高</text>
          <input class="input" v-model="form.height" type="digit" placeholder="请输入" />
          <text class="unit">cm</text>
        </view>
        <view class="form-item">
          <text class="label">体重</text>
          <input class="input" v-model="form.weight" type="digit" placeholder="请输入" />
          <text class="unit">kg</text>
        </view>
        <view class="form-item" @click="showBloodTypePicker = true">
          <text class="label">血型</text>
          <text class="value">{{ form.bloodType || '请选择' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 健康档案 -->
    <view class="section">
      <view class="section-title">健康档案</view>
      <view class="form-group">
        <view class="form-item column">
          <text class="label">过敏史</text>
          <view class="tags-container">
            <view 
              v-for="(tag, index) in allergyOptions" 
              :key="index"
              class="tag"
              :class="{ 
                active: form.allergyHistory.includes(tag),
                editing: editingField === 'allergyHistory' && tag !== '无' && tag !== '其他'
              }"
              @click.stop="toggleTag('allergyHistory', tag)"
              @touchstart="handleTouchStart('allergyHistory')"
              @touchend="handleTouchEnd"
            >
              {{ tag }}
              <view 
                class="close-btn" 
                v-if="editingField === 'allergyHistory' && tag !== '无' && tag !== '其他'"
                @click.stop="deleteTag(tag, 'allergyHistory', 'allergyOptions')"
              >×</view>
            </view>
          </view>
        </view>
        <view class="form-item column">
          <text class="label">慢病史</text>
          <view class="tags-container">
            <view 
              v-for="(tag, index) in chronicOptions" 
              :key="index"
              class="tag"
              :class="{ 
                active: form.chronicDisease.includes(tag),
                editing: editingField === 'chronicDisease' && tag !== '无' && tag !== '其他'
              }"
              @click.stop="toggleTag('chronicDisease', tag)"
              @touchstart="handleTouchStart('chronicDisease')"
              @touchend="handleTouchEnd"
            >
              {{ tag }}
              <view 
                class="close-btn" 
                v-if="editingField === 'chronicDisease' && tag !== '无' && tag !== '其他'"
                @click.stop="deleteTag(tag, 'chronicDisease', 'chronicOptions')"
              >×</view>
            </view>
          </view>
        </view>
        <view class="form-item column">
          <text class="label">手术/外伤史</text>
          <view class="tags-container">
            <view 
              v-for="(tag, index) in surgeryOptions" 
              :key="index"
              class="tag"
              :class="{ 
                active: form.surgeryHistory.includes(tag),
                editing: editingField === 'surgeryHistory' && tag !== '无' && tag !== '其他'
              }"
              @click.stop="toggleTag('surgeryHistory', tag)"
              @touchstart="handleTouchStart('surgeryHistory')"
              @touchend="handleTouchEnd"
            >
              {{ tag }}
              <view 
                class="close-btn" 
                v-if="editingField === 'surgeryHistory' && tag !== '无' && tag !== '其他'"
                @click.stop="deleteTag(tag, 'surgeryHistory', 'surgeryOptions')"
              >×</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 生活习惯 -->
    <view class="section">
      <view class="section-title">生活习惯</view>
      <view class="form-group">
        <view class="form-item column">
          <view class="tags-container">
            <view 
              v-for="(tag, index) in lifestyleOptions" 
              :key="index"
              class="tag"
              :class="{ 
                active: form.lifestyleTags.includes(tag),
                editing: editingField === 'lifestyleTags' && tag !== '无' && tag !== '其他'
              }"
              @click.stop="toggleTag('lifestyleTags', tag)"
              @touchstart="handleTouchStart('lifestyleTags')"
              @touchend="handleTouchEnd"
            >
              {{ tag }}
              <view 
                class="close-btn" 
                v-if="editingField === 'lifestyleTags' && tag !== '无' && tag !== '其他'"
                @click.stop="deleteTag(tag, 'lifestyleTags', 'lifestyleOptions')"
              >×</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <button class="save-btn" @click="handleSave" :loading="saving">保存</button>

    <!-- 性别选择器 -->
    <view class="picker-mask" v-if="showGenderPicker" @click="showGenderPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text @click="showGenderPicker = false">取消</text>
          <text class="title">选择性别</text>
          <text @click="confirmGender">确定</text>
        </view>
        <picker-view class="picker-view" :value="[tempGenderIndex]" @change="onGenderChange">
          <picker-view-column>
            <view class="picker-item" v-for="(item, index) in genderOptions" :key="index">{{ item.label }}</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <!-- 日期选择器 -->
    <view class="picker-mask" v-if="showDatePicker" @click="showDatePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text @click="showDatePicker = false">取消</text>
          <text class="title">选择日期</text>
          <text @click="confirmDate">确定</text>
        </view>
        <picker-view class="picker-view" :value="datePickerValue" @change="onDateChange">
          <picker-view-column>
            <view class="picker-item" v-for="year in years" :key="year">{{ year }}年</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="month in months" :key="month">{{ month }}月</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="day in days" :key="day">{{ day }}日</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <!-- 地区选择器 -->
    <view class="picker-mask" v-if="showRegionPicker" @click="showRegionPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text @click="showRegionPicker = false">取消</text>
          <text class="title">选择地区</text>
          <text @click="confirmRegion">确定</text>
        </view>
        <picker-view class="picker-view" :value="regionPickerValue" @change="onRegionChange">
          <picker-view-column>
            <view class="picker-item" v-for="(item, index) in provinces" :key="index">{{ item }}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(item, index) in cities" :key="index">{{ item }}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(item, index) in districts" :key="index">{{ item }}</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <!-- 血型选择器 -->
    <view class="picker-mask" v-if="showBloodTypePicker" @click="showBloodTypePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text @click="showBloodTypePicker = false">取消</text>
          <text class="title">选择血型</text>
          <text @click="confirmBloodType">确定</text>
        </view>
        <picker-view class="picker-view" :value="[tempBloodIndex]" @change="onBloodTypeChange">
          <picker-view-column>
            <view class="picker-item" v-for="(item, index) in bloodTypeOptions" :key="index">{{ item }}</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
    <!-- Checkbox 弹窗 (用于"其他"输入) -->
    <view class="modal-mask" v-if="showCustomInputModal" @click.stop>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">{{ customInputTitle }}</text>
        </view>
        <view class="modal-body">
          <input 
            class="custom-input" 
            v-model="customInputValue" 
            placeholder="请输入内容" 
            focus
          />
        </view>
        <view class="modal-footer">
          <button class="btn cancel" @click="cancelCustomInput">取消</button>
          <button class="btn confirm" @click="confirmCustomInput">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiGetUserInfo, apiUpdateUserInfo, apiUploadAvatar } from '@/utils/request.js'

export default {
  data() {
    return {
      saving: false,
      form: {
        nickname: '',
        avatarUrl: '',
        gender: 0,
        realName: '',
        birthdate: '',
        province: '',
        city: '',
        district: '',
        height: '',
        weight: '',
        bloodType: '',
        allergyHistory: [],
        chronicDisease: [],
        surgeryHistory: [],
        lifestyleTags: []
      },
      // 选择器显示状态
      showGenderPicker: false,
      showDatePicker: false,
      showRegionPicker: false,
      showBloodTypePicker: false,
      // 临时选择值
      tempGenderIndex: 0,
      tempBloodIndex: 0,
      datePickerValue: [30, 0, 0],
      regionPickerValue: [0, 0, 0],
      // 选项数据
      genderOptions: [
        { label: '未知', value: 0 },
        { label: '男', value: 1 },
        { label: '女', value: 2 }
      ],
      bloodTypeOptions: ['A型', 'B型', 'O型', 'AB型', '其他', '不清楚'],
      allergyOptions: ['无', '青霉素', '头孢', '磺胺类', '花粉', '海鲜', '牛奶', '鸡蛋', '其他'],
      chronicOptions: ['无', '高血压', '糖尿病', '心脏病', '哮喘', '甲状腺疾病', '其他'],
      surgeryOptions: ['无', '阑尾切除', '骨折', '剖腹产', '心脏手术', '其他'],
      lifestyleOptions: ['不吸烟', '吸烟', '戒烟', '不饮酒', '偶尔饮酒', '经常饮酒', '经常运动', '偶尔运动', '不运动', '素食', '荤素均衡', '其他'],
      // 日期数据
      years: [],
      months: [1,2,3,4,5,6,7,8,9,10,11,12],
      days: [],
      // 地区数据 (简化版)
      provinces: ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省', '湖南省', '河南省', '河北省'],
      citiesData: {
        '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'],
        '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区'],
        '广东省': ['广州市', '深圳市', '珠海市', '东莞市', '佛山市', '中山市'],
        '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市', '扬州市'],
        '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市'],
        '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '自贡市', '乐山市'],
        '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄石市', '十堰市'],
        '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市'],
        '河南省': ['郑州市', '洛阳市', '开封市', '南阳市', '新乡市', '安阳市'],
        '河北省': ['石家庄市', '唐山市', '保定市', '邯郸市', '秦皇岛市', '沧州市']
      },
      districtsData: {
        '北京市': { '东城区': [], '西城区': [], '朝阳区': [], '海淀区': [], '丰台区': [], '石景山区': [] }, // 简化
        '上海市': { '黄浦区': [], '徐汇区': [], '长宁区': [], '静安区': [], '普陀区': [], '虹口区': [] },
        '广东省': { 
            '广州市': ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区'], 
            '深圳市': ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '龙华区'],
            '珠海市': ['香洲区', '斗门区', '金湾区'],
            '东莞市': ['莞城区', '南城区', '东城区', '万江区'],
            '佛山市': ['禅城区', '南海区', '顺德区', '高明区', '三水区'],
            '中山市': ['中山市区']
        },
        '江苏省': {
            '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区'],
            '苏州市': ['姑苏区', '虎丘区', '吴中区', '相城区', '吴江区']
        },
        '浙江省': {
            '杭州市': ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区'],
            '宁波市': ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区']
        }
        // 其他省份暂略，实际项目中应引入完整行政区划库
      },
      cities: [],
      districts: [],
      // 自定义输入相关
      showCustomInputModal: false,
      customInputField: '',
      customInputValue: '',
      customInputTitle: '',
      // 编辑模式相关
      editingField: '',
      longPressTimer: null
    }
  },
  computed: {
    genderText() {
      const item = this.genderOptions.find(g => g.value === this.form.gender)
      return item ? item.label : '未知'
    },
    regionText() {
      if (this.form.province || this.form.city || this.form.district) {
        return `${this.form.province} ${this.form.city} ${this.form.district}`.trim()
      }
      return '请选择'
    }
  },
  onLoad() {
    this.initDateData()
    this.initRegionData()
    this.loadUserInfo()
  },
  methods: {
    initDateData() {
      const currentYear = new Date().getFullYear()
      for (let i = currentYear; i >= currentYear - 100; i--) {
        this.years.push(i)
      }
      this.updateDays(1)
    },
    updateDays(month) {
      const year = this.years[this.datePickerValue[0]] || new Date().getFullYear()
      const daysInMonth = new Date(year, month, 0).getDate()
      this.days = []
      for (let i = 1; i <= daysInMonth; i++) {
        this.days.push(i)
      }
    },
    initRegionData() {
      // 默认选中第一个
      const defaultProv = this.provinces[0]
      this.cities = this.citiesData[defaultProv] || []
      const defaultCity = this.cities[0]
      
      // 尝试获取区数据
      if (this.districtsData[defaultProv] && this.districtsData[defaultProv][defaultCity]) {
          this.districts = this.districtsData[defaultProv][defaultCity]
      } else {
          this.districts = ['市区', '郊区'] // 兜底
      }
    },
    async loadUserInfo() {
      try {
        const res = await apiGetUserInfo()
        if (res.data) {
          const user = res.data
          this.form.nickname = user.nickname || ''
          this.form.avatarUrl = user.avatarUrl || ''
          this.form.gender = user.gender || 0
          this.form.realName = user.realName || ''
          this.form.birthdate = user.birthdate || ''
          this.form.province = user.province || ''
          this.form.city = user.city || ''
          this.form.district = user.district || ''
          this.form.height = user.height ? String(user.height) : ''
          this.form.weight = user.weight ? String(user.weight) : ''
          this.form.bloodType = user.bloodType || ''
          // 解析JSON数组
          this.form.allergyHistory = this.parseJsonArray(user.allergyHistory)
          this.form.chronicDisease = this.parseJsonArray(user.chronicDisease)
          this.form.surgeryHistory = this.parseJsonArray(user.surgeryHistory)
          this.form.lifestyleTags = this.parseJsonArray(user.lifestyleTags)
          
          // 合并自定义标签到选项列表，确保能显示
          this.mergeCustomTags('allergyHistory', 'allergyOptions')
          this.mergeCustomTags('chronicDisease', 'chronicOptions')
          this.mergeCustomTags('surgeryHistory', 'surgeryOptions')
          this.mergeCustomTags('lifestyleTags', 'lifestyleOptions')

          // 更新选择器索引
          this.tempGenderIndex = this.genderOptions.findIndex(g => g.value === this.form.gender)
          if (this.tempGenderIndex < 0) this.tempGenderIndex = 0
        }
      } catch (err) {
        console.error('加载用户信息失败:', err)
      }
    },
    mergeCustomTags(formField, optionField) {
        if (!this.form[formField] || !this[optionField]) return
        
        this.form[formField].forEach(tag => {
            if (tag !== '无' && !this[optionField].includes(tag)) {
                // 插入到"其他"之前，或者末尾
                const otherIndex = this[optionField].indexOf('其他')
                if (otherIndex > -1) {
                    this[optionField].splice(otherIndex, 0, tag)
                } else {
                    this[optionField].push(tag)
                }
            }
        })
    },
    parseJsonArray(jsonStr) {
      if (!jsonStr) return []
      try {
        return JSON.parse(jsonStr)
      } catch (e) {
        return []
      }
    },
    calculateAge(birthdate) {
      if (!birthdate) return '未知'
      const birth = new Date(birthdate)
      const now = new Date()
      let age = now.getFullYear() - birth.getFullYear()
      const m = now.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--
      }
      return age + '岁'
    },
    chooseAvatar() {
      // 移除头像上传功能
    },
    // 处理长按开始
    handleTouchStart(field) {
      if (this.longPressTimer) clearTimeout(this.longPressTimer)
      this.longPressTimer = setTimeout(() => {
        // 1.5秒后进入编辑模式
        this.editingField = field
        uni.vibrateShort()
      }, 1500)
    },
    // 处理触摸结束
    handleTouchEnd() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    },
    // 退出编辑模式
    exitEditMode() {
      this.editingField = ''
    },
    toggleTag(field, tag) {
      // 如果处于编辑模式，点击标签不切换选中状态，而是可能退出编辑（如果没点到叉号）
      // 这里如果点到标签本体，可以视为退出编辑或者无操作，根据需求
      // 简单起见，如果正在编辑该字段，点击标签本体视为无操作（因为要删只能点叉号）
      // 或者点击本体也退出编辑？
      if (this.editingField === field) {
          // 不做操作，等待用户点叉号或点空白
          return
      }
      
      if (tag === '其他') {
        this.openCustomInput(field)
        return
      }
      
      const index = this.form[field].indexOf(tag)
      if (index > -1) {
        this.form[field].splice(index, 1)
      } else {
        // 如果选择"无"，清空其他选项
        if (tag === '无') {
          this.form[field] = ['无']
        } else {
          // 如果选择其他项，移除"无"
          const noIndex = this.form[field].indexOf('无')
          if (noIndex > -1) {
            this.form[field].splice(noIndex, 1)
          }
          this.form[field].push(tag)
        }
      }
    },
    handleLongPress(tag, formField, optionField) {
      // 已废弃，改用TouchStart模拟
    },
    deleteTag(tag, formField, optionField) {
        // 1. 从选中列表中移除
        if (this.form[formField]) {
            const index = this.form[formField].indexOf(tag)
            if (index > -1) {
              this.form[formField].splice(index, 1)
            }
        }
        
        // 2. 从选项列表中移除
        if (this[optionField]) {
            const optIndex = this[optionField].indexOf(tag)
            if (optIndex > -1) {
              this[optionField].splice(optIndex, 1)
            }
        }
        
        // 如果删完了所有显示出来的标签，退出编辑模式（为了体验更好，保留编辑模式也可以，直到用户主动点空白）
        // 建议保留
        // uni.showToast({ title: '删除成功', icon: 'none' })
    },
    openCustomInput(field) {
      this.customInputField = field
      this.customInputValue = ''
      
      let title = '请输入'
      if (field === 'allergyHistory') title = '请输入过敏源'
      if (field === 'chronicDisease') title = '请输入疾病名称'
      if (field === 'surgeryHistory') title = '请输入手术名称'
      if (field === 'lifestyleTags') title = '请输入生活习惯'
      
      this.customInputTitle = title
      this.showCustomInputModal = true
    },
    confirmCustomInput() {
      if (!this.customInputValue.trim()) {
        uni.showToast({ title: '内容不能为空', icon: 'none' })
        return
      }
      
      const field = this.customInputField
      const newVal = this.customInputValue.trim()
      
      // 移除"无"
      const noIndex = this.form[field].indexOf('无')
      if (noIndex > -1) {
        this.form[field].splice(noIndex, 1)
      }
      
      // 添加到选中列表
      if (!this.form[field].includes(newVal)) {
          this.form[field].push(newVal)
      }
      
      // 添加到选项列表（用于显示）
      let optionField = ''
      if (field === 'allergyHistory') optionField = 'allergyOptions'
      else if (field === 'chronicDisease') optionField = 'chronicOptions'
      else if (field === 'surgeryHistory') optionField = 'surgeryOptions'
      else if (field === 'lifestyleTags') optionField = 'lifestyleOptions'
      
      if (optionField && !this[optionField].includes(newVal)) {
           const otherIndex = this[optionField].indexOf('其他')
           if (otherIndex > -1) {
               this[optionField].splice(otherIndex, 0, newVal)
           } else {
               this[optionField].push(newVal)
           }
      }
      
      this.showCustomInputModal = false
    },
    cancelCustomInput() {
      this.showCustomInputModal = false
    },
    onGenderChange(e) {
      this.tempGenderIndex = e.detail.value[0]
    },
    confirmGender() {
      this.form.gender = this.genderOptions[this.tempGenderIndex].value
      this.showGenderPicker = false
    },
    onDateChange(e) {
      this.datePickerValue = e.detail.value
      this.updateDays(this.months[this.datePickerValue[1]])
    },
    confirmDate() {
      const year = this.years[this.datePickerValue[0]]
      const month = String(this.months[this.datePickerValue[1]]).padStart(2, '0')
      const day = String(this.days[this.datePickerValue[2]] || 1).padStart(2, '0')
      this.form.birthdate = `${year}-${month}-${day}`
      this.showDatePicker = false
    },
    onRegionChange(e) {
      const provinceIndex = e.detail.value[0]
      const cityIndex = e.detail.value[1]
      // 更新城市列表
      if (provinceIndex !== this.regionPickerValue[0]) {
        this.cities = this.citiesData[this.provinces[provinceIndex]] || []
        
        // 更新区数据
        const provName = this.provinces[provinceIndex]
        const defaultCity = this.cities[0]
        if (this.districtsData[provName] && this.districtsData[provName][defaultCity]) {
            this.districts = this.districtsData[provName][defaultCity]
        } else {
            this.districts = ['市区', '郊区']
        }
        
        this.regionPickerValue = [provinceIndex, 0, 0]
      } else if (cityIndex !== this.regionPickerValue[1]) { // 城市变化，更新区
          this.regionPickerValue = e.detail.value
          const provName = this.provinces[provinceIndex]
          const cityName = this.cities[cityIndex]
          
          if (this.districtsData[provName] && this.districtsData[provName][cityName]) {
              this.districts = this.districtsData[provName][cityName]
          } else {
              this.districts = ['市区', '郊区']
          }
          // 重置区索引
          this.regionPickerValue[2] = 0
      } else {
        this.regionPickerValue = e.detail.value
      }
    },
    confirmRegion() {
      this.form.province = this.provinces[this.regionPickerValue[0]] || ''
      this.form.city = this.cities[this.regionPickerValue[1]] || ''
      this.form.district = this.districts[this.regionPickerValue[2]] || ''
      this.showRegionPicker = false
    },
    onBloodTypeChange(e) {
      this.tempBloodIndex = e.detail.value[0]
    },
    confirmBloodType() {
      this.form.bloodType = this.bloodTypeOptions[this.tempBloodIndex]
      this.showBloodTypePicker = false
    },
    async handleSave() {
      if (this.saving) return
      this.saving = true
      try {
        const data = {
          nickname: this.form.nickname || null,
          avatarUrl: this.form.avatarUrl || null,
          gender: this.form.gender,
          realName: this.form.realName || null,
          birthdate: this.form.birthdate || null,
          province: this.form.province || null,
          city: this.form.city || null,
          district: this.form.district || null,
          height: this.form.height ? parseFloat(this.form.height) : null,
          weight: this.form.weight ? parseFloat(this.form.weight) : null,
          bloodType: this.form.bloodType || null,
          allergyHistory: this.form.allergyHistory.length > 0 ? this.form.allergyHistory : null,
          chronicDisease: this.form.chronicDisease.length > 0 ? this.form.chronicDisease : null,
          surgeryHistory: this.form.surgeryHistory.length > 0 ? this.form.surgeryHistory : null,
          lifestyleTags: this.form.lifestyleTags.length > 0 ? this.form.lifestyleTags : null
        }
        await apiUpdateUserInfo(data)
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (err) {
        console.error('保存失败:', err)
        uni.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style lang="scss">
.profile-edit-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 120rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
  background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 80rpx;
    border: 4rpx solid #fff;
    background: #f0f0f0;
  }
  
  .avatar-tip {
    margin-top: 16rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
    .info-text {
        margin-top: 20rpx;
        text-align: center;
        
        .nickname {
            display: block;
            font-size: 36rpx;
            font-weight: bold;
            color: #fff;
            margin-bottom: 8rpx;
        }
        
        .sub-info {
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.9);
        }
    }

}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  
  .section-title {
    padding: 24rpx 30rpx;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    border-bottom: 1rpx solid #f5f5f5;
  }
}

.form-group {
  .form-item {
    display: flex;
    align-items: center;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.column {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .label {
      width: 160rpx;
      font-size: 28rpx;
      color: #333;
      flex-shrink: 0;
    }
    
    .input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      text-align: right;
    }
    
    .value {
      flex: 1;
      font-size: 28rpx;
      color: #666;
      text-align: right;
    }
    
    .unit {
      margin-left: 10rpx;
      font-size: 26rpx;
      color: #999;
    }
    
    .arrow {
      margin-left: 10rpx;
      font-size: 28rpx;
      color: #ccc;
    }
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
  width: 100%;
  
  .tag {
    position: relative; // 为绝对定位的关闭按钮做准备
    padding: 12rpx 24rpx;
    margin: 8rpx;
    font-size: 24rpx;
    color: #666;
    background: #f5f5f5;
    border-radius: 30rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;
    
    &.active {
      color: #4A90D9;
      background: rgba(74, 144, 217, 0.1);
      border-color: #4A90D9;
    }
    
    // 编辑模式下的悬浮效果
    &.editing {
      transform: scale(1.05);
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
      z-index: 10;
    }
    
    .close-btn {
      position: absolute;
      top: -16rpx;
      right: -16rpx;
      width: 32rpx;
      height: 32rpx;
      background: #ff4d4f;
      border-radius: 50%;
      color: #fff;
      font-size: 24rpx;
      line-height: 28rpx; // 微调垂直居中
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 11;
      box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
    }
  }
}


.save-btn {
  margin: 40rpx 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #4A90D9 0%, #67B8DE 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
  
  &::after {
    border: none;
  }
}

// 选择器样式
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.picker-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  text {
    font-size: 28rpx;
    color: #4A90D9;
  }
  
  .title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
  }
}

.picker-view {
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
}

/* 模态框样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  
  .modal-header {
    padding: 30rpx;
    text-align: center;
    border-bottom: 1rpx solid #eee;
    
    .modal-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .modal-body {
    padding: 40rpx 30rpx;
    
    .custom-input {
      width: 100%;
      height: 80rpx;
      background: #f5f5f5;
      border-radius: 10rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      border: 1rpx solid #eee;
      box-sizing: border-box;
    }
  }
  
  .modal-footer {
    display: flex;
    border-top: 1rpx solid #eee;
    
    .btn {
      flex: 1;
      height: 90rpx;
      line-height: 90rpx;
      text-align: center;
      font-size: 30rpx;
      background: #fff;
      border-radius: 0;
      &::after { border: none; }
    }
    
    .cancel {
      color: #666;
      border-right: 1rpx solid #eee;
    }
    
    .confirm {
      color: #4A90D9;
    }
  }
}

</style>
