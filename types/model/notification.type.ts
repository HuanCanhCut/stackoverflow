import { UserModel } from './user.type'

// Trạng thái nhận thông báo của riêng user hiện tại (bản ghi recipient)
export interface NotificationRecipientModel {
    id: string
    notification_id: string
    recipient_id: number
    // Đã đọc (đã bấm vào) thông báo hay chưa -> quyết định chấm xanh "chưa đọc"
    is_read: boolean
    // Đã nhìn thấy (đã mở trang thông báo) hay chưa -> quyết định badge trên chuông
    is_seen: boolean
    created_at: string
    updated_at: string
}

// Phân loại thông báo theo metadata.type để chọn icon và điều hướng phù hợp.
// Backend hiện phát 'question_rejected'; các loại còn lại dự phòng cho khi mở rộng.
export type NotificationType = 'question_rejected' | 'answer' | 'vote' | 'accepted' | 'comment'

export interface NotificationMetadata {
    type?: NotificationType | string
    question_id?: number
    parent_id?: number | null
    [key: string]: unknown
}

export interface NotificationModel {
    id: string
    content: string
    metadata: NotificationMetadata | null
    actor_id: number
    actor: UserModel
    created_at: string
    updated_at: string
    // Trạng thái đọc/nhìn của chính user hiện tại đối với thông báo này
    recipient: NotificationRecipientModel
}
