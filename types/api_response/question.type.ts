import { QuestionModel, QuestionVoteModel } from '@/types/model/question.type'
import { ApiResponse, ResponsePagination } from '../common.type'

export type CreateQuestionResponse = ApiResponse<QuestionModel>

export type GetQuestionsResponse = ResponsePagination<QuestionModel[]>

export type GetQuestionResponse = ApiResponse<QuestionModel>

export type GetQuestionRepliesResponse = ResponsePagination<QuestionModel[]>

export type VoteQuestionResponse = ApiResponse<QuestionVoteModel>
