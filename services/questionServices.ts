import axiosClient from '@/lib/axiosClient'
import { CreateQuestionResponse, GetQuestionsResponse } from '@/types/api_response/question.type'

export const getQuestions = async ({
    search,
    page = 1,
    perPage = 10,
}: {
    search?: string
    page?: number
    perPage?: number
}): Promise<GetQuestionsResponse> => {
    const res = await axiosClient.get('/questions', {
        params: { search, page, per_page: perPage },
    })

    return res.data
}

export const createQuestion = async ({
    title,
    body,
    tags,
    uploadIds,
}: {
    title: string
    body: string
    tags: string[]
    uploadIds: string[]
}): Promise<CreateQuestionResponse> => {
    const res = await axiosClient.post('/questions', {
        title,
        body,
        tags: tags.map((name) => ({ id: null, name })),
        upload_ids: uploadIds,
    })

    return res.data
}
