import { MessageModel } from '@/types/model/conversation.type'
import { UserModel } from '@/types/model/user.type'

export enum SocketEvent {
    QUESTION_MODERATED = 'question:moderated',
    NOTIFICATION_CREATED = 'notification:created',
    MESSAGE_CREATED = 'message:created',
}

// Tin nhắn mới (cả tin của chính mình gửi từ thiết bị khác), kèm sender
export type MessageCreatedPayload = MessageModel & { sender: UserModel }

export interface NotificationCreatedPayload {
    id: string
    content: string
}

export interface QuestionModeratedPayload {
    question_id: number
    parent_id: number | null
    title: string
    status: 'rejected'
    categories: ('politics' | 'misinformation' | 'indecent')[]
    reason: string
}
