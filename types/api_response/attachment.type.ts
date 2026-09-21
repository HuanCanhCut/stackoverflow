import { PresignedUrlModel } from '@/types/model/attachment.type'
import { ApiResponse } from '../common.type'

export type GetPresignedUrlResponse = ApiResponse<PresignedUrlModel[]>
