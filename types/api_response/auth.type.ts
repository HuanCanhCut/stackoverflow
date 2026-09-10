import { UserModel } from '@/types/model/user.type'
import { ApiResponse } from '../common.type'

export type LoginResponse = ApiResponse<
    UserModel,
    {
        access_token: string
        refresh_token: string
    }
>

export type RegisterResponse = LoginResponse

export type GetCurrentUserResponse = ApiResponse<UserModel>
