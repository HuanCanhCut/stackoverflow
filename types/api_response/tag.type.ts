import { TagModel } from '@/types/model/tag.type'
import { ApiResponse } from '../common.type'

export type GetTagsResponse = ApiResponse<TagModel[]>
