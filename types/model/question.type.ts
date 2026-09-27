import { TagModel } from '@/types/model/tag.type'
import { UserModel } from '@/types/model/user.type'

export interface QuestionTagModel {
    question_id: number
    tag_id: number
    tag: TagModel
}

export interface QuestionAttachmentModel {
    id: number
    question_id: number
    object_key: string
    created_at: string
    updated_at: string
}

export interface QuestionModel {
    id: number
    title: string
    body: string
    author_id: number
    parent_id: number | null
    vote_count: number
    created_at: string
    updated_at: string
    tags: QuestionTagModel[]
    attachments: QuestionAttachmentModel[]
    author?: UserModel
    reply_count?: number
}
