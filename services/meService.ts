import axiosClient from '@/lib/axiosClient'
import { GetCurrentUserResponse, UpdateCurrentUserResponse } from '@/types/api_response/auth.type'

export const getCurrentUser = async (): Promise<GetCurrentUserResponse> => {
    const res = await axiosClient.get('/auth/me')

    return res.data
}

// Cập nhật hồ sơ người dùng hiện tại (PATCH /auth/me).
// Backend lưu first_name/last_name riêng, full_name là field tính toán nên sẽ tự cập nhật theo.
// Ảnh đại diện: client chỉ gửi avatar_upload_id (của ảnh đã upload S3), backend tự dựng avatar_path công khai.
// Các trường đều optional: chỉ gửi trường nào thực sự thay đổi.
export const updateCurrentUser = async (payload: {
    first_name?: string
    last_name?: string
    nickname?: string
    avatar_upload_id?: string
}): Promise<UpdateCurrentUserResponse> => {
    const res = await axiosClient.patch('/auth/me', payload)

    return res.data
}
