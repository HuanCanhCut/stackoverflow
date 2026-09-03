import axiosClient from '@/lib/axiosClient'
import { LoginResponse } from '@/types/api_response/auth.type'

export const login = async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await axiosClient.post('/auth/login', {
        email,
        password,
    })

    return res.data
}
