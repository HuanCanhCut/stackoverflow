import axiosClient from '@/lib/axiosClient'
import {
    GetConversationResponse,
    GetConversationsResponse,
    GetMessagesResponse,
    SendMessageResponse,
} from '@/types/api_response/conversation.type'

// Mở hội thoại với một user: server trả về hội thoại sẵn có hoặc tạo mới
export const findOrCreateConversation = async (userId: number): Promise<GetConversationResponse> => {
    const res = await axiosClient.post('/conversations', { user_id: userId })

    return res.data
}

export const getConversations = async ({
    page = 1,
    perPage = 20,
}: {
    page?: number
    perPage?: number
} = {}): Promise<GetConversationsResponse> => {
    const res = await axiosClient.get('/conversations', {
        params: { page, per_page: perPage },
    })

    return res.data
}

export const getConversation = async (id: number): Promise<GetConversationResponse> => {
    const res = await axiosClient.get(`/conversations/${id}`)

    return res.data
}

// Tin nhắn trả về từ mới tới cũ; truyền cursor (id tin cũ nhất đã có) để tải tiếp các tin cũ hơn
export const getMessages = async ({
    conversationId,
    cursor,
    limit = 30,
}: {
    conversationId: number
    cursor?: string | null
    limit?: number
}): Promise<GetMessagesResponse> => {
    const res = await axiosClient.get(`/conversations/${conversationId}/messages`, {
        params: { cursor: cursor ?? undefined, limit },
    })

    return res.data
}

export const sendMessage = async ({
    conversationId,
    content,
    uploadIds = [],
}: {
    conversationId: number
    content?: string
    uploadIds?: string[]
}): Promise<SendMessageResponse> => {
    const res = await axiosClient.post(`/conversations/${conversationId}/messages`, {
        content,
        upload_ids: uploadIds,
    })

    return res.data
}

// Đánh dấu đã đọc mọi tin nhắn người kia gửi trong hội thoại
export const markConversationAsRead = async (conversationId: number): Promise<void> => {
    await axiosClient.patch(`/conversations/${conversationId}/read`)
}
