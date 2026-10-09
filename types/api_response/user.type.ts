import { UserModel, UserStats } from '@/types/model/user.type'
import { ApiResponse } from '../common.type'

export type GetUserResponse = ApiResponse<UserModel & UserStats>
