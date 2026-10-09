import { UserModel } from '@/types/model/user.type'

export interface MessageAttachmentModel {
    id: number
    message_id: number
    object_key: string
    url: string
    created_at: string
    updated_at: string
}

export interface MessageModel {
    id: number
    conversation_id: number
    sender_id: number
    content: string | null
    read_at: string | null
    created_at: string
    updated_at: string
    attachments: MessageAttachmentModel[]
    /** Chỉ có ở tin nhắn vừa gửi (response của API gửi tin và sự kiện socket) */
    sender?: UserModel
}

export interface ConversationModel {
    id: number
    user_one_id: number
    user_two_id: number
    last_message_at: string | null
    created_at: string
    updated_at: string
    /** Người còn lại trong hội thoại 1-1 */
    partner: UserModel
    last_message: MessageModel | null
    /** Số tin nhắn người kia gửi mà mình chưa đọc */
    unread_count: number
}
