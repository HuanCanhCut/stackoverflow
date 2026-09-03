import type { AxiosError } from 'axios'

export interface ApiResponse<T, M = never> {
    data: T
    meta?: M
}

export interface BaseModel {
    id: string
    created_at: Date
    updated_at: Date
}

export interface MetaPagination<M = object> {
    meta: {
        pagination: {
            total: number
            count: number
            per_page: number
            current_page: number
            total_pages: number
        }
    } & M
}

export interface MetaCursorPagination<M = object> {
    meta: {
        pagination: {
            limit: number
            has_next_page: boolean
            next_cursor: string | null
            has_prev_page?: boolean
            prev_cursor?: string | null
        }
        links: {
            next: string | null
            prev?: string | null
        }
    } & M
}

export interface ResponsePagination<T, M = object> extends MetaPagination<M> {
    data: T
}

export interface ResponseCursorPagination<T, M = object> extends MetaCursorPagination<M> {
    data: T
}

export type APIError = AxiosError<{
    message: string
    status_code: string
    error: any
}>
