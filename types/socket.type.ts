export enum SocketEvent {
    QUESTION_MODERATED = 'question:moderated',
}

export interface QuestionModeratedPayload {
    question_id: number
    parent_id: number | null
    title: string
    status: 'rejected'
    categories: ('politics' | 'misinformation' | 'indecent')[]
    reason: string
}
