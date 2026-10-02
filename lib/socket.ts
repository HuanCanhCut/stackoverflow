import { getNewToken } from '@/lib/axiosClient'
import * as secureStorage from 'expo-secure-store'
import { io } from 'socket.io-client'

// Gateway chạy cùng server với API nhưng không có prefix /api
const SOCKET_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? '').replace(/\/api\/?$/, '')

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
    // Đọc token mới nhất mỗi lần (re)connect
    auth: (callback) => {
        secureStorage.getItemAsync('access_token').then((token) => callback({ token }))
    },
})

socket.on('connect_error', async (error) => {
    // Server từ chối vì access token hết hạn: refresh rồi kết nối lại (socket.io không tự thử lại trong trường hợp này)
    if (error.message !== 'TOKEN_EXPIRED') return

    try {
        await getNewToken()
        socket.connect()
    } catch {
        // Refresh thất bại: axios sẽ xử lý đăng xuất ở request tiếp theo
    }
})
