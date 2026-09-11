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

export const sendForgotPasswordCode = async ({ email }: { email: string }): Promise<void> => {
    const res = await axiosClient.post('/auth/forgot-password/code', {
        email,
    })

    return res.data
}

export const resetPassword = async ({
    email,
    password,
    code,
}: {
    email: string
    password: string
    code: number
}): Promise<void> => {
    const res = await axiosClient.post('/auth/reset-password', {
        email,
        password,
        code,
    })

    return res.data
}

