export enum SocketEvent {
    QUESTION_MODERATED = 'question:moderated',
    NOTIFICATION_CREATED = 'notification:created',
}

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
