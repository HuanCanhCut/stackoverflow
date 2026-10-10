import { UserModel, UserStats } from '@/types/model/user.type'
import { ApiResponse, ResponsePagination } from '../common.type'

export type GetUserResponse = ApiResponse<UserModel & UserStats>

export type SearchUsersResponse = ResponsePagination<UserModel[]>
