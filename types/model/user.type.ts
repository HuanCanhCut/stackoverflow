import { BaseModel } from '../common.type'

export interface UserModel extends BaseModel {
    first_name: string
    last_name: string
    full_name: string
    nickname: string
    avatar_path: string | null
    bio: string | null
    role: 'user' | 'admin'
    is_active: boolean
    is_blocked: boolean
    blocked_at: string | null
    blocked_reason: string | null
    blocked_by: string | null
}

// Thống kê kèm theo khi lấy thông tin user hiện tại (GET /auth/me)
export interface UserStats {
    // Tổng vote nhận được trên tất cả bài viết (cả câu hỏi lẫn câu trả lời)
    vote_count: number
    // Số câu hỏi đã đăng (bài gốc, không tính câu trả lời)
    question_count: number
    // Tổng số câu trả lời đã đăng
    answer_count: number
}
