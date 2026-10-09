import { socket } from '@/lib/socket'
import { incrementUnseenCount } from '@/redux/reducers/notificationSlice'
import { useAppDispatch, useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import {
    MessageCreatedPayload,
    NotificationCreatedPayload,
    QuestionModeratedPayload,
    SocketEvent,
} from '@/types/socket.type'
import { usePathname, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner-native'

/** Kết nối socket khi đã đăng nhập và hiển thị các sự kiện realtime dạng toast */
const SocketListener = () => {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const currentUserId = useAppSelector(selectCurrentUser)?.id
    const pathname = usePathname()

    // Dùng ref để handler socket đọc được màn hình hiện tại mà không phải đăng ký lại listener mỗi lần chuyển trang
    const pathnameRef = useRef(pathname)

    useEffect(() => {
        pathnameRef.current = pathname
    }, [pathname])

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

        // Tin nhắn mới từ người khác: hiện toast, trừ khi đang mở đúng hội thoại đó hoặc đang ở danh sách tin nhắn
        const handleMessageCreated = (payload: MessageCreatedPayload) => {
            const isViewingChat =
                pathnameRef.current === '/conversations' ||
                pathnameRef.current === `/conversations/${payload.conversation_id}`

            if (payload.sender_id === currentUserId || isViewingChat) return

            toast.info(payload.sender.full_name, {
                description: payload.content ?? 'Đã gửi hình ảnh',
                action: {
                    label: 'Xem',
                    onClick: () => {
                        router.push({
                            pathname: '/(protected)/conversations/[id]',
                            params: { id: payload.conversation_id },
                        })
                    },
                },
            })
        }

        socket.on(SocketEvent.QUESTION_MODERATED, handleQuestionModerated)
        socket.on(SocketEvent.NOTIFICATION_CREATED, handleNotificationCreated)
        socket.on(SocketEvent.MESSAGE_CREATED, handleMessageCreated)
        socket.connect()

        return () => {
            socket.off(SocketEvent.QUESTION_MODERATED, handleQuestionModerated)
            socket.off(SocketEvent.NOTIFICATION_CREATED, handleNotificationCreated)
            socket.off(SocketEvent.MESSAGE_CREATED, handleMessageCreated)
            socket.disconnect()
        }
    }, [currentUserId, router, dispatch])

    return null
}

export default SocketListener
