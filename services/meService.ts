import axiosClient from '@/lib/axiosClient'
import { GetCurrentUserResponse } from '@/types/api_response/auth.type'

export const getCurrentUser = async (): Promise<GetCurrentUserResponse> => {
    const res = await axiosClient.get('/auth/me')

    return res.data
}
