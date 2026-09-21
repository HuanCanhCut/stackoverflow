import axiosClient from '@/lib/axiosClient'
import { GetTagsResponse } from '@/types/api_response/tag.type'

export const getTags = async ({ search }: { search: string }): Promise<GetTagsResponse> => {
    const res = await axiosClient.get('/tags', {
        params: { search },
    })

    return res.data
}
