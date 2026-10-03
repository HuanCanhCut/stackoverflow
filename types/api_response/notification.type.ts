import { NotificationModel } from '@/types/model/notification.type'
import { ResponsePagination } from '../common.type'

// GET /notifications: danh sách phân trang kèm số thông báo chưa nhìn (unseen) trong meta
export type GetNotificationsResponse = ResponsePagination<NotificationModel[], { unseen_count: number }>
