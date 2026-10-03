import { createSlice, type Dispatch } from '@reduxjs/toolkit'
import * as notificationServices from '@/services/notificationServices'

// Chỉ giữ số thông báo chưa nhìn để hiển thị badge trên icon chuông ở thanh điều hướng
const initialState: {
    unseenCount: number
} = {
    unseenCount: 0,
}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setUnseenCount: (state, { payload }: { payload: number }) => {
            state.unseenCount = payload
        },
        // Nhận thông báo mới realtime -> tăng badge
        incrementUnseenCount: (state) => {
            state.unseenCount += 1
        },
    },
})

// Lấy số thông báo chưa nhìn từ meta của danh sách (chỉ cần 1 item cho nhẹ)
export const fetchUnseenNotificationCount = () => {
    return async (dispatch: Dispatch) => {
        try {
            const res = await notificationServices.getNotifications({ page: 1, perPage: 1 })

            dispatch(setUnseenCount(res.meta.unseen_count))
        } catch {
            // Không chặn luồng chính nếu lấy số thông báo thất bại
        }
    }
}

export const { setUnseenCount, incrementUnseenCount } = notificationSlice.actions

export default notificationSlice
