/**
 * WebSocket 通知连接管理
 * 
 * 用于接收后端实时推送的通知（叫号、排队变动等）
 * 连接端点：ws://host/ws/notify?userId=xxx&role=USER
 */

const WS_BASE = 'ws://192.168.1.73:8080'

let socketTask = null
let heartbeatTimer = null
let reconnectTimer = null
let reconnectCount = 0
const MAX_RECONNECT = 5

/** 通知监听器 */
const listeners = {}

/**
 * 连接通知 WebSocket
 * @param {string|number} userId 用户ID
 */
export function connectNotifyWs(userId) {
    if (socketTask) {
        console.log('[NotifyWS] 已有连接，先关闭旧连接')
        closeNotifyWs()
    }

    const url = `${WS_BASE}/ws/notify?userId=${userId}&role=USER`
    console.log('[NotifyWS] 正在连接:', url)

    socketTask = uni.connectSocket({
        url,
        success: () => console.log('[NotifyWS] 连接请求已发送'),
        fail: (err) => console.error('[NotifyWS] 连接失败:', err)
    })

    uni.onSocketOpen(() => {
        console.log('[NotifyWS] 连接成功')
        reconnectCount = 0
        startHeartbeat()
    })

    uni.onSocketMessage((res) => {
        try {
            const msg = JSON.parse(res.data)
            console.log('[NotifyWS] 收到通知:', msg)
            handleNotification(msg)
        } catch (e) {
            console.error('[NotifyWS] 消息解析失败:', e)
        }
    })

    uni.onSocketClose(() => {
        console.log('[NotifyWS] 连接关闭')
        stopHeartbeat()
        socketTask = null
        tryReconnect(userId)
    })

    uni.onSocketError((err) => {
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
        uni.closeSocket()
        socketTask = null
    }
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
        uni.showModal({
            title: '叫号通知',
            content: data.message || '轮到您就诊了',
            confirmText: '进入聊天室',
            cancelText: '稍后',
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({
                        url: `/pages/consult/chat?appointmentId=${data.appointmentId}`
                    })
                }
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
            uni.sendSocketMessage({
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
