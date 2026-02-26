/**
 * API请求封装模块
 * 统一管理baseUrl、请求拦截、响应处理
 */

// ==================== 开发测试配置 ====================
// 开发模式默认Token（永不过期，用户ID=1）
// 设置为 true 开启开发模式，会自动设置默认token
const DEV_MODE = true
const DEV_TOKEN = 'dev_mock_token_user_1'

// 开发模式下自动设置默认token
if (DEV_MODE && !uni.getStorageSync('token')) {
  uni.setStorageSync('token', DEV_TOKEN)
  console.log('[开发模式] 已设置默认Token:', DEV_TOKEN)
}
// ==================== 开发测试配置 END ====================

// API基础地址配置
export const BASE_URL = 'http://192.168.1.73:8080'

// 请求超时时间
const TIMEOUT = 30000

/**
 * 封装uni.request为Promise
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    // 获取存储的token
    const token = uni.getStorageSync('token')

    // 合并请求头
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 如果有token，添加到请求头
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      timeout: TIMEOUT,
      success: (res) => {
        // 统一处理响应
        if (res.statusCode === 200) {
          // 业务成功
          if (res.data.code === 0 || res.data.code === 200) {
            resolve(res.data)
          } else {
            // 业务错误
            handleBusinessError(res.data)
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          // 登录态过期
          handleUnauthorized()
          reject({ code: 401, message: '登录已过期，请重新登录' })
        } else {
          // HTTP错误
          uni.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          reject({ code: res.statusCode, message: '网络请求失败' })
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject({ code: -1, message: err.errMsg || '网络连接失败' })
      }
    })
  })
}

/**
 * 处理业务错误
 */
function handleBusinessError(data) {
  uni.showToast({
    title: data.message || '操作失败',
    icon: 'none'
  })
}

/**
 * 处理登录态过期
 */
function handleUnauthorized() {
  // 清除本地存储的登录信息
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')

  // 跳转到登录页
  uni.showModal({
    title: '提示',
    content: '登录已过期，请重新登录',
    showCancel: false,
    success: () => {
      uni.reLaunch({
        url: '/pages/login/login'
      })
    }
  })
}

// API基础地址（用于文件上传）
const UPLOAD_BASE_URL = 'http://192.168.1.73:8080'

/**
 * 
 * 封装uni.uploadFile为Promise
 * @param {string} filePath 文件临时路径
 * @param {string} url 上传接口地址
 * @param {string} name 文件字段名
 * @returns {Promise}
 */
export function uploadFile(filePath, url, name = 'file') {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: UPLOAD_BASE_URL + url,
      filePath: filePath,
      name: name,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0 || data.code === 200) {
              resolve(data)
            } else {
              uni.showToast({ title: data.message || '上传失败', icon: 'none' })
              reject(data)
            }
          } catch (e) {
            reject({ code: -1, message: '解析响应失败' })
          }
        } else {
          reject({ code: res.statusCode, message: '上传失败' })
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject({ code: -1, message: err.errMsg || '上传失败' })
      }
    })
  })
}

/**
 * 上传用户头像
 * @param {string} filePath 图片临时路径
 */
export function apiUploadAvatar(filePath) {
  return uploadFile(filePath, '/api/v1/user/avatar', 'avatar')
}

// ==================== 公共接口（无需登录） ====================

/**
 * 获取科室列表
 */
export function apiGetDepartments() {
  return request({
    url: '/api/v1/public/departments',
    method: 'GET'
  })
}

/**
 * 获取定位城市
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 */
export function apiGetLocation(latitude, longitude) {
  return request({
    url: `/api/v1/public/location?latitude=${latitude}&longitude=${longitude}`,
    method: 'GET'
  })
}

/**
 * 按科室查询医生列表
 * @param {number} departmentId 科室ID（可选，不传则查全部）
 */
export function apiGetDoctors(departmentId) {
  const params = {}
  if (departmentId) {
    params.departmentId = departmentId
  }
  return request({
    url: '/api/v1/public/doctors',
    method: 'GET',
    data: params
  })
}

/**
 * 获取医生详情
 * @param {number} id 医生ID
 */
export function apiGetDoctorDetail(id) {
  return request({
    url: `/api/v1/public/doctors/${id}`,
    method: 'GET'
  })
}

/**
 * 查询医生一周排班
 * @param {number} doctorId 医生ID
 */
export function apiGetDoctorSchedules(doctorId) {
  return request({
    url: `/api/v1/public/schedules/doctor/${doctorId}/week`,
    method: 'GET'
  })
}

// ==================== 用户端接口（需登录） ====================

/**
 * 用户登录（微信小程序）
 * @param {string} code 微信登录code
 * @param {string} phoneCode 手机号授权code
 */
export function apiLogin(code, phoneCode) {
  return request({
    url: '/api/v1/user/wechat-login',
    method: 'POST',
    data: { code, phoneCode }
  })
}

/**
 * 获取用户信息
 */
export function apiGetUserInfo() {
  return request({
    url: '/api/v1/user/info',
    method: 'GET'
  })
}

/**
 * 更新用户信息（完善信息）
 * @param {Object} data 用户信息
 */
export function apiUpdateUserInfo(data) {
  return request({
    url: '/api/v1/user/info',
    method: 'PUT',
    data
  })
}

/**
 * 获取预约列表
 * @param {Object} params 分页参数
 */
export function apiGetAppointments(params) {
  return request({
    url: '/api/v1/user/appointments',
    method: 'GET',
    data: params
  })
}

/**
 * 创建预约
 * @param {Object} data 预约信息
 */
export function apiCreateAppointment(data) {
  return request({
    url: '/api/v1/user/appointments',
    method: 'POST',
    data
  })
}

/**
 * 获取预约详情
 * @param {number} id 预约ID
 */
export function apiGetAppointmentDetail(id) {
  return request({
    url: `/api/v1/user/appointments/${id}`,
    method: 'GET'
  })
}

/**
 * 取消预约
 * @param {number} id 预约ID
 */
export function apiCancelAppointment(id) {
  return request({
    url: `/api/v1/user/appointments/${id}/cancel`,
    method: 'POST'
  })
}

/**
 * 创建支付订单
 * @param {Object} data 支付信息
 */
export function apiCreatePayment(data) {
  return request({
    url: '/api/v1/user/payments/create',
    method: 'POST',
    data
  })
}

/**
 * 查询支付状态
 * @param {Object} params 查询参数
 */
export function apiGetPaymentStatus(params) {
  return request({
    url: '/api/v1/user/payments/status',
    method: 'GET',
    data: params
  })
}

/**
 * 发送问诊消息
 * @param {Object} data 消息内容
 */
export function apiSendMessage(data) {
  return request({
    url: '/api/v1/user/consults/messages',
    method: 'POST',
    data
  })
}

/**
 * 获取聊天记录
 * @param {number} appointmentId 预约ID
 */
export function apiGetMessages(appointmentId) {
  return request({
    url: `/api/v1/user/consults/messages/${appointmentId}`,
    method: 'GET'
  })
}

/**
 * 标记消息已读
 * @param {Object} data 消息ID列表
 */
export function apiMarkMessagesRead(data) {
  return request({
    url: '/api/v1/user/consults/messages/read',
    method: 'POST',
    data
  })
}

/**
 * 获取会话列表
 */
export function apiGetConsultSessions() {
  return request({
    url: '/api/v1/user/consults/sessions',
    method: 'GET'
  })
}

/**
 * 获取未读消息数
 */
export function apiGetUnreadCount() {
  return request({
    url: '/api/v1/user/consults/messages/unread',
    method: 'GET'
  })
}

/**
 * 创建问诊记录
 * @param {Object} data 问诊信息
 */
export function apiCreateConsultRecord(data) {
  return request({
    url: '/api/v1/user/consults/records',
    method: 'POST',
    data
  })
}

/**
 * 查询问诊记录
 * @param {number} appointmentId 预约ID
 */
export function apiGetConsultRecord(appointmentId) {
  return request({
    url: `/api/v1/user/consults/records/${appointmentId}`,
    method: 'GET'
  })
}

/**
 * AI问诊（同步）
 * @param {Object} data 问诊内容
 */
export function apiAiChat(data) {
  return request({
    url: '/api/v1/user/consults/ai-chat',
    method: 'POST',
    data
  })
}

// ==================== 健康档案相关接口 ====================

/**
 * 获取健康档案汇总
 */
export function apiGetHealthSummary() {
  return request({
    url: '/api/v1/user/health/summary',
    method: 'GET'
  })
}

/**
 * 获取体检报告列表
 */
export function apiGetHealthReports(params) {
  return request({
    url: '/api/v1/user/health/reports',
    method: 'GET',
    data: params
  })
}

/**
 * 获取病史记录列表
 */
export function apiGetMedicalHistory() {
  return request({
    url: '/api/v1/user/health/history',
    method: 'GET'
  })
}

/**
 * 添加病史记录
 */
export function apiAddMedicalHistory(data) {
  return request({
    url: '/api/v1/user/health/history',
    method: 'POST',
    data
  })
}

/**
 * 获取用药记录列表
 */
export function apiGetMedications() {
  return request({
    url: '/api/v1/user/health/medications',
    method: 'GET'
  })
}

/**
 * 添加用药记录
 */
export function apiAddMedication(data) {
  return request({
    url: '/api/v1/user/health/medications',
    method: 'POST',
    data
  })
}

/**
 * 获取过敏记录列表
 */
export function apiGetAllergies() {
  return request({
    url: '/api/v1/user/health/allergies',
    method: 'GET'
  })
}

/**
 * 添加过敏记录
 */
export function apiAddAllergy(data) {
  return request({
    url: '/api/v1/user/health/allergies',
    method: 'POST',
    data
  })
}

// ==================== 通知消息相关接口 ====================

/**
 * 获取通知列表
 */
export function apiGetNotifications(params) {
  return request({
    url: '/api/v1/user/notifications',
    method: 'GET',
    data: params
  })
}

/**
 * 获取未读通知数
 */
export function apiGetNotificationUnreadCount() {
  return request({
    url: '/api/v1/user/notifications/unread/count',
    method: 'GET'
  })
}

/**
 * 标记通知已读
 */
export function apiMarkNotificationRead(id) {
  return request({
    url: `/api/v1/user/notifications/${id}/read`,
    method: 'POST'
  })
}

/**
 * 全部标记已读
 */
export function apiMarkAllNotificationsRead() {
  return request({
    url: '/api/v1/user/notifications/read-all',
    method: 'POST'
  })
}



// ==================== 问诊评价相关接口 ====================

/**
 * 创建评价
 */
export function apiCreateEvaluation(data) {
  return request({
    url: '/api/v1/user/evaluations',
    method: 'POST',
    data
  })
}

/**
 * 根据预约ID获取评价
 */
export function apiGetEvaluationByAppointment(appointmentId) {
  return request({
    url: `/api/v1/user/evaluations/appointment/${appointmentId}`,
    method: 'GET'
  })
}

/**
 * 获取医生评价统计
 */
export function apiGetDoctorEvaluationStats(doctorId) {
  return request({
    url: `/api/v1/user/evaluations/doctor/${doctorId}/stats`,
    method: 'GET'
  })
}

// ==================== 资讯文章相关接口 ====================

/**
 * 获取文章列表
 */
export function apiGetArticles(params) {
  return request({
    url: '/api/v1/public/articles',
    method: 'GET',
    data: params
  })
}

/**
 * 获取推荐文章
 */
export function apiGetRecommendArticles(limit = 5) {
  return request({
    url: '/api/v1/public/articles/recommend',
    method: 'GET',
    data: { limit }
  })
}

/**
 * 获取文章详情
 */
export function apiGetArticleDetail(id) {
  return request({
    url: `/api/v1/public/articles/${id}`,
    method: 'GET'
  })
}

/**
 * 点赞文章
 */
export function apiLikeArticle(id) {
  return request({
    url: `/api/v1/public/articles/${id}/like`,
    method: 'POST'
  })
}

// ==================== AI会话管理接口 ====================

/**
 * 获取AI会话列表
 */
export function apiGetAiSessions() {
  return request({
    url: '/api/v1/user/ai/sessions',
    method: 'GET'
  })
}

/**
 * 创建新的AI会话
 */
export function apiCreateAiSession() {
  return request({
    url: '/api/v1/user/ai/sessions',
    method: 'POST'
  })
}

/**
 * 获取AI会话详情
 */
export function apiGetAiSessionDetail(sessionId) {
  return request({
    url: `/api/v1/user/ai/sessions/${sessionId}`,
    method: 'GET'
  })
}

/**
 * 搜索AI会话
 */
export function apiSearchAiSessions(keyword) {
  return request({
    url: '/api/v1/user/ai/sessions/search',
    method: 'GET',
    data: { keyword }
  })
}

/**
 * 删除AI会话
 */
export function apiDeleteAiSession(sessionId) {
  return request({
    url: `/api/v1/user/ai/sessions/${sessionId}`,
    method: 'DELETE'
  })
}

