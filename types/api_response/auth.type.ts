import { UserModel, UserStats } from '@/types/model/user.type'
import { ApiResponse } from '../common.type'

export type LoginResponse = ApiResponse<
    UserModel,
    {
        access_token: string
        refresh_token: string
    }
>

export type RegisterResponse = LoginResponse

// GET /auth/me kèm số liệu thống kê của user
export type GetCurrentUserResponse = ApiResponse<UserModel & UserStats>

// PATCH /auth/me chỉ trả về thông tin user (không kèm thống kê)
export type UpdateCurrentUserResponse = ApiResponse<UserModel>
