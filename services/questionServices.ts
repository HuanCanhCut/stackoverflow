import axiosClient from '@/lib/axiosClient'
import { CreateQuestionResponse } from '@/types/api_response/question.type'

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
