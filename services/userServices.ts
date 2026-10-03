import axiosClient from '@/lib/axiosClient'
import { GetQuestionsResponse } from '@/types/api_response/question.type'

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
