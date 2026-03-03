/**
 * WebSocket 通知连接管理（使用 SocketTask 方式）
 * 
 * 用于接收后端实时推送的通知（叫号、排队变动等）
 * 连接端点：ws://host/ws/notify?userId=xxx&role=USER
 * 
 * 使用 SocketTask 方式避免与微信开发工具日志回显冲突
 */

const WS_BASE = 'ws://127.0.0.1:8084'

let socketTask = null
let heartbeatTimer = null
let reconnectTimer = null
let reconnectCount = 0
let currentUserId = null
const MAX_RECONNECT = 5

/** 通知监听器 */
const listeners = {}

/**
 * 连接通知 WebSocket（使用 SocketTask 方式）
 * @param {string|number} userId 用户ID
 */
export function connectNotifyWs(userId) {
    if (socketTask) {
        console.log('[NotifyWS] 已有连接，先关闭旧连接')
        closeNotifyWs()
    }

    currentUserId = userId
    const url = `${WS_BASE}/ws/notify?userId=${userId}&role=USER`
    console.log('[NotifyWS] 正在连接:', url)

    // 使用 SocketTask 方式，避免与开发工具日志回显冲突
    socketTask = uni.connectSocket({
        url,
        success: () => console.log('[NotifyWS] 连接请求已发送'),
        fail: (err) => console.error('[NotifyWS] 连接失败:', err)
    })

    // 使用 SocketTask 实例方法绑定事件
    socketTask.onOpen(() => {
        console.log('[NotifyWS] 连接成功')
        reconnectCount = 0
        startHeartbeat()
    })

    socketTask.onMessage((res) => {
        try {
            const msg = JSON.parse(res.data)
            console.log('[NotifyWS] 收到通知:', msg)
            handleNotification(msg)
        } catch (e) {
            console.error('[NotifyWS] 消息解析失败:', e)
        }
    })

    socketTask.onClose(() => {
        console.log('[NotifyWS] 连接关闭')
        stopHeartbeat()
        socketTask = null
        tryReconnect(currentUserId)
    })

    socketTask.onError((err) => {
        console.error('[NotifyWS] 连接错误:', err)
    })
}

/**
 * 关闭通知 WebSocket
 */
export function closeNotifyWs() {
    stopHeartbeat()
    clearTimeout(reconnectTimer)
    reconnectCount = MAX_RECONNECT // 防止自动重连
    if (socketTask) {
        socketTask.close()
        socketTask = null
    }
    currentUserId = null
}

/**
 * 检查 WebSocket 是否已连接
 * @returns {boolean}
 */
export function isWsConnected() {
    return socketTask !== null
}

/**
 * 注册通知监听
 * @param {string} type 通知类型 (CALL_NUMBER / QUEUE_UPDATE / CONSULT_END)
 * @param {Function} callback 回调函数
 */
export function onNotify(type, callback) {
    if (!listeners[type]) {
        listeners[type] = []
    }
    listeners[type].push(callback)
}

/**
 * 移除通知监听
 * @param {string} type 通知类型
 * @param {Function} callback 回调函数
 */
export function offNotify(type, callback) {
    if (listeners[type]) {
        listeners[type] = listeners[type].filter(cb => cb !== callback)
    }
}

/** 处理收到的通知 */
function handleNotification(msg) {
    const { type, data } = msg

    // 触发对应类型的监听器
    if (listeners[type]) {
        listeners[type].forEach(cb => cb(data))
    }

    // 叫号通知：弹出提示并引导进入聊天室
    if (type === 'CALL_NUMBER') {
        console.log('[NotifyWS] 处理叫号通知，准备弹窗:', data)
        uni.showModal({
            title: '叫号通知',
            content: data.message || '轮到您就诊了',
            confirmText: '立即前往',
            cancelText: '稍后',
            success: (res) => {
                console.log('[NotifyWS] 弹窗结果:', res)
                if (res.confirm) {
                    uni.navigateTo({
                        url: `/pages/consult/chat?appointmentId=${data.appointmentId}`
                    })
                }
            },
            fail: (err) => {
                console.error('[NotifyWS] 弹窗失败:', err)
            }
        })
    }

    // 排队变动：静默更新（页面自己通过监听器处理）
    if (type === 'QUEUE_UPDATE') {
        // 由等候页面的监听器自行处理
    }

    // 问诊结束通知
    if (type === 'CONSULT_END') {
        uni.showToast({
            title: '问诊已结束',
            icon: 'none',
            duration: 3000
        })
    }
}

/** 心跳保活 */
function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
        if (socketTask) {
            socketTask.send({
                data: JSON.stringify({ type: 'ping' }),
                fail: () => { }
            })
        }
    }, 30000)
}

function stopHeartbeat() {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
}

/** 断线重连 */
function tryReconnect(userId) {
    if (reconnectCount >= MAX_RECONNECT) return
    reconnectCount++
    console.log(`[NotifyWS] ${reconnectCount}/${MAX_RECONNECT} 次重连...`)
    reconnectTimer = setTimeout(() => {
        connectNotifyWs(userId)
    }, 3000 * reconnectCount)
}
