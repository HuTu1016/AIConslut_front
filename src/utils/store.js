/**
 * 简易状态管理模块
 * 管理用户登录态和基本信息
 */

// 用户信息存储键名
const USER_INFO_KEY = 'userInfo'
const TOKEN_KEY = 'token'

/**
 * 获取用户信息
 * @returns {Object|null}
 */
export function getUserInfo() {
    try {
        const info = uni.getStorageSync(USER_INFO_KEY)
        return info ? JSON.parse(info) : null
    } catch (e) {
        return null
    }
}

/**
 * 设置用户信息
 * @param {Object} userInfo 
 */
export function setUserInfo(userInfo) {
    uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo))
}

/**
 * 获取Token
 * @returns {string|null}
 */
export function getToken() {
    return uni.getStorageSync(TOKEN_KEY) || null
}

/**
 * 设置Token
 * @param {string} token 
 */
export function setToken(token) {
    uni.setStorageSync(TOKEN_KEY, token)
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!getToken()
}

/**
 * 清除登录信息
 */
export function clearLoginInfo() {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_INFO_KEY)
}

/**
 * 登录成功后保存信息
 * @param {Object} data 登录返回的数据
 */
export function saveLoginInfo(data) {
    if (data.token) {
        setToken(data.token)
    }
    if (data.userInfo) {
        setUserInfo(data.userInfo)
    }
}

/**
 * 检查登录态，未登录则跳转登录页
 * @returns {boolean} 是否已登录
 */
export function checkLogin() {
    if (!isLoggedIn()) {
        uni.navigateTo({
            url: '/pages/login/login'
        })
        return false
    }
    return true
}
