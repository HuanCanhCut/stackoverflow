import { ConversationModel, MessageModel } from '@/types/model/conversation.type'
import { ApiResponse, ResponseCursorPagination, ResponsePagination } from '../common.type'

export type GetConversationsResponse = ResponsePagination<ConversationModel[]>

export type GetConversationResponse = ApiResponse<ConversationModel>

export type GetMessagesResponse = ResponseCursorPagination<MessageModel[]>

export type SendMessageResponse = ApiResponse<MessageModel>
