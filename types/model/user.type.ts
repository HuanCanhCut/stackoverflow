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
