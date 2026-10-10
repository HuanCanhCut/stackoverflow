import axiosClient from '@/lib/axiosClient'
import { GetQuestionsResponse } from '@/types/api_response/question.type'
import { GetUserResponse, SearchUsersResponse } from '@/types/api_response/user.type'

// Hồ sơ công khai của một user kèm thống kê
export const getUser = async (userId: number): Promise<GetUserResponse> => {
    const res = await axiosClient.get(`/users/${userId}`)

    return res.data
}

// Câu hỏi do người dùng đăng
export const getUserQuestions = async ({
    userId,
    page = 1,
    perPage = 10,
}: {
    userId: number
    page?: number
    perPage?: number
}): Promise<GetQuestionsResponse> => {
    const res = await axiosClient.get(`/users/${userId}/questions`, {
        params: { page, per_page: perPage },
    })

    return res.data
}

// Các câu trả lời do chính người dùng viết (trả lời câu hỏi và phản hồi câu trả lời khác)
export const getUserAnswers = async ({
    userId,
    page = 1,
    perPage = 10,
}: {
    userId: number
    page?: number
    perPage?: number
}): Promise<GetQuestionsResponse> => {
    const res = await axiosClient.get(`/users/${userId}/answers`, {
        params: { page, per_page: perPage },
    })

    return res.data
}

// Tìm người theo tên / nickname để bắt đầu nhắn tin (server đã loại chính mình và tài khoản bị khóa)
export const searchUsers = async ({
    q,
    page = 1,
    perPage = 20,
}: {
    q: string
    page?: number
    perPage?: number
}): Promise<SearchUsersResponse> => {
    const res = await axiosClient.get('/users/search', {
        params: { q, page, per_page: perPage },
    })

    return res.data
}
