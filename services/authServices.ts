import axiosClient from '@/lib/axiosClient'
import { LoginResponse, RegisterResponse } from '@/types/api_response/auth.type'

export const login = async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await axiosClient.post('/auth/login', {
        email,
        password,
    })

    return res.data
}

export const register = async ({
    email,
    password,
    full_name,
}: {
    email: string
    password: string
    full_name: string
}): Promise<RegisterResponse> => {
    const res = await axiosClient.post('/auth/register', {
        email,
        password,
        full_name,
    })

    return res.data
}
