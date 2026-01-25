/**
 * API请求封装模块
 * 统一管理baseUrl、请求拦截、响应处理
 */

// API基础地址配置
const BASE_URL = 'http://192.168.134.91:8080'

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
 * 更新用户信息
 * @param {Object} data 用户信息
 */
export function apiUpdateUserInfo(data) {
  return request({
    url: '/api/v1/user/update',
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
 * @param {Object} params 查询参数
 */
export function apiGetMessages(params) {
  return request({
    url: '/api/v1/user/consults/messages',
    method: 'GET',
    data: params
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
    url: '/api/v1/user/consults/ai/chat',
    method: 'POST',
    data
  })
}

// 导出BASE_URL供流式请求使用
export { BASE_URL }
