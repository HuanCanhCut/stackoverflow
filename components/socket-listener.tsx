import { socket } from '@/lib/socket'
import { incrementUnseenCount } from '@/redux/reducers/notificationSlice'
import { useAppDispatch, useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { NotificationCreatedPayload, QuestionModeratedPayload, SocketEvent } from '@/types/socket.type'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { toast } from 'sonner-native'

/** Kết nối socket khi đã đăng nhập và hiển thị các sự kiện realtime dạng toast */
const SocketListener = () => {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const currentUserId = useAppSelector(selectCurrentUser)?.id

    useEffect(() => {
        if (!currentUserId) return

        // Thông báo mới (có người trả lời / bình chọn...): tăng badge chuông và hiện toast
        const handleNotificationCreated = (payload: NotificationCreatedPayload) => {
            dispatch(incrementUnseenCount())

            toast.info('Thông báo mới', {
                description: payload.content,
                action: {
                    label: 'Xem',
                    onClick: () => router.push('/(protected)/notifications'),
                },
            })
        }

        const handleQuestionModerated = (payload: QuestionModeratedPayload) => {
            const isReply = payload.parent_id !== null

            toast.error(isReply ? 'Câu trả lời của bạn đã bị ẩn' : `Câu hỏi "${payload.title}" đã bị ẩn`, {
                description: payload.reason,
                duration: 8000,
                // Câu trả lời có thể nằm sâu trong cây comment nên chỉ mở được trang của câu hỏi
                action: isReply
                    ? undefined
                    : {
                          label: 'Xem',
                          onClick: () => {
                              router.push({
                                  pathname: '/(public)/questions/[id]',
                                  params: { id: payload.question_id },
                              })
                          },
                      },
            })
        }

        socket.on(SocketEvent.QUESTION_MODERATED, handleQuestionModerated)
        socket.on(SocketEvent.NOTIFICATION_CREATED, handleNotificationCreated)
        socket.connect()

        return () => {
            socket.off(SocketEvent.QUESTION_MODERATED, handleQuestionModerated)
            socket.off(SocketEvent.NOTIFICATION_CREATED, handleNotificationCreated)
            socket.disconnect()
        }
    }, [currentUserId, router, dispatch])

    return null
}

export default SocketListener
