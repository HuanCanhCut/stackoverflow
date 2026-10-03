import axiosClient from '@/lib/axiosClient'
import { GetNotificationsResponse } from '@/types/api_response/notification.type'

export const getNotifications = async ({
    page = 1,
    perPage = 20,
}: {
    page?: number
    perPage?: number
} = {}): Promise<GetNotificationsResponse> => {
    const res = await axiosClient.get('/notifications', {
        params: { page, per_page: perPage },
    })

    return res.data
}

// Đánh dấu tất cả thông báo là đã nhìn (xóa badge trên chuông)
export const markAllAsSeen = async (): Promise<void> => {
    await axiosClient.patch('/notifications/seen')
}

// Đánh dấu tất cả thông báo là đã đọc (xóa chấm xanh "chưa đọc")
export const markAllAsRead = async (): Promise<void> => {
    await axiosClient.patch('/notifications/read')
}

// Đánh dấu một thông báo là đã đọc
export const markAsRead = async (id: string): Promise<void> => {
    await axiosClient.patch(`/notifications/${id}/read`)
}

export const deleteNotification = async (id: string): Promise<void> => {
    await axiosClient.delete(`/notifications/${id}`)
}
