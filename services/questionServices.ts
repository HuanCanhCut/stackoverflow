import axiosClient from '@/lib/axiosClient'
import {
    CreateQuestionResponse,
    GetQuestionRepliesResponse,
    GetQuestionResponse,
    GetQuestionsResponse,
    UpdateQuestionResponse,
    VoteQuestionResponse,
} from '@/types/api_response/question.type'

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
    parentId,
}: {
    title: string
    body: string
    tags: string[]
    uploadIds: string[]
    parentId?: number
}): Promise<CreateQuestionResponse> => {
    const res = await axiosClient.post('/questions', {
        title,
        body,
        tags: tags.map((name) => ({ id: null, name })),
        upload_ids: uploadIds,
        parent_id: parentId,
    })

    return res.data
}

export const getQuestion = async (id: number): Promise<GetQuestionResponse> => {
    const res = await axiosClient.get(`/questions/${id}`)

    return res.data
}

export const getQuestionReplies = async ({
    id,
    orderBy = 'newest',
    page = 1,
    perPage = 10,
}: {
    id: number
    orderBy?: 'vote' | 'newest'
    page?: number
    perPage?: number
}): Promise<GetQuestionRepliesResponse> => {
    const res = await axiosClient.get(`/questions/${id}/replies`, {
        params: { order_by: orderBy, page, per_page: perPage },
    })

    return res.data
}

export const voteQuestion = async ({
    id,
    type,
}: {
    id: number
    type: 'upvote' | 'downvote'
}): Promise<VoteQuestionResponse> => {
    const res = await axiosClient.patch(`/questions/${id}/${type}`)

    return res.data
}

export const saveQuestion = async (id: number) => {
    await axiosClient.post(`/questions/${id}/save`)
}

export const unsaveQuestion = async (id: number) => {
    await axiosClient.delete(`/questions/${id}/save`)
}

export const updateQuestion = async ({
    id,
    title,
    body,
    tags,
}: {
    id: number
    title: string
    body: string
    tags: string[]
}): Promise<UpdateQuestionResponse> => {
    const res = await axiosClient.patch(`/questions/${id}`, {
        title,
        body,
        tags: tags.map((name) => ({ id: null, name })),
    })

    return res.data
}
