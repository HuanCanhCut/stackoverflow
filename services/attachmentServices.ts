import axiosClient from '@/lib/axiosClient'
import { GetPresignedUrlResponse } from '@/types/api_response/attachment.type'
import { S3ContentType, S3Folder } from '@/types/model/attachment.type'

export const getPresignedUrls = async ({
    files,
}: {
    files: { folder: S3Folder; content_type: S3ContentType }[]
}): Promise<GetPresignedUrlResponse> => {
    const res = await axiosClient.post('/uploads/s3/presigned-url', { files })

    return res.data
}
