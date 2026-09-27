import { QuestionModel } from '@/types/model/question.type'
import { ApiResponse, ResponsePagination } from '../common.type'

export type CreateQuestionResponse = ApiResponse<QuestionModel>

export type GetQuestionsResponse = ResponsePagination<QuestionModel[]>
