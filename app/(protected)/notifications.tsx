import NotificationItem from '@/components/notification-item'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/redux/redux.type'
import { setUnseenCount } from '@/redux/reducers/notificationSlice'
import * as notificationServices from '@/services/notificationServices'
import { NotificationModel } from '@/types/model/notification.type'
import handleApiError from '@/utils/handleApiError'
import { useFocusEffect, useRouter } from 'expo-router'
import { BellOff } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'

const PER_PAGE = 20

const NotificationsPage = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()

    const [items, setItems] = useState<NotificationModel[]>([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

    const loadPage = useCallback(async (pageToLoad: number) => {
        setLoading(true)

        try {
            const res = await notificationServices.getNotifications({ page: pageToLoad, perPage: PER_PAGE })

            // Trang 1 thay mới, các trang sau nối vào cuối
            setItems((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]))
            setPage(pageToLoad)
            setTotalPages(res.meta.pagination.total_pages)
            setLoaded(true)
        } catch (error) {
            handleApiError(error)
            setLoaded(true)
        } finally {
            setLoading(false)
        }
    }, [])

    // Mỗi lần mở/quay lại màn hình: đánh dấu đã nhìn (xóa badge trên chuông) và tải lại trang đầu
    useFocusEffect(
        useCallback(() => {
            let ignore = false

            const init = async () => {
                try {
                    await notificationServices.markAllAsSeen()
                    if (!ignore) dispatch(setUnseenCount(0))
                } catch {
                    // Không chặn việc tải danh sách nếu đánh dấu đã nhìn lỗi
                }

                if (!ignore) await loadPage(1)
            }

            init()

            return () => {
                ignore = true
            }
        }, [loadPage, dispatch]),
    )

    const hasUnread = items.some((item) => !item.recipient.is_read)
    const canLoadMore = loaded && page < totalPages

    const handleMarkAllRead = async () => {
        if (isMarkingAllRead || !hasUnread) return

        setIsMarkingAllRead(true)

        try {
            await notificationServices.markAllAsRead()
            setItems((prev) => prev.map((item) => ({ ...item, recipient: { ...item.recipient, is_read: true } })))
        } catch (error) {
            handleApiError(error)
        } finally {
            setIsMarkingAllRead(false)
        }
    }

    const openNotification = (notification: NotificationModel) => {
        // Đánh dấu đã đọc ngay trên UI; gọi API nền, lỗi cũng không ảnh hưởng điều hướng
        if (!notification.recipient.is_read) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, recipient: { ...item.recipient, is_read: true } }
                        : item,
                ),
            )
            notificationServices.markAsRead(notification.id).catch(() => {})
        }

        // Mở câu hỏi liên quan: reply thì mở câu hỏi gốc (parent_id), còn lại mở chính câu hỏi
        const targetId = notification.metadata?.parent_id ?? notification.metadata?.question_id

        if (targetId != null) {
            router.push({ pathname: '/(public)/questions/[id]', params: { id: targetId } })
        }
    }

    // Nhấn giữ một thông báo để xóa khỏi danh sách
    const confirmDelete = (notification: NotificationModel) => {
        Alert.alert('Xóa thông báo', 'Bạn có chắc muốn xóa thông báo này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => {
                    // Xóa lạc quan trên UI; nếu API lỗi thì khôi phục lại
                    const snapshot = items
                    setItems((prev) => prev.filter((item) => item.id !== notification.id))

                    notificationServices.deleteNotification(notification.id).catch((error) => {
                        handleApiError(error)
                        setItems(snapshot)
                    })
                },
            },
        ])
    }

    return (
        <View className="flex-1 bg-background">
            {/* Tiêu đề + đánh dấu tất cả đã đọc */}
            <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
                <Text className="text-2xl font-bold">Thông báo</Text>

                <Pressable onPress={handleMarkAllRead} disabled={!hasUnread || isMarkingAllRead} hitSlop={8}>
                    <Text
                        className={cn(
                            'text-sm font-medium',
                            hasUnread ? 'text-blue-600' : 'text-muted-foreground',
                        )}
                    >
                        Đánh dấu tất cả đã đọc
                    </Text>
                </Pressable>
            </View>

            {/* Nội dung */}
            {!loaded && loading ? (
                <ActivityIndicator size="small" className="mt-10" />
            ) : items.length === 0 ? (
                <View className="mt-24 items-center gap-3 px-4">
                    <BellOff size={40} color="#94a3b8" />
                    <Text className="text-center text-muted-foreground">Bạn chưa có thông báo nào</Text>
                </View>
            ) : (
                <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pt-1">
                    {items.map((item) => (
                        <NotificationItem
                            key={item.id}
                            notification={item}
                            onPress={() => openNotification(item)}
                            onLongPress={() => confirmDelete(item)}
                        />
                    ))}

                    {canLoadMore ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 self-center"
                            disabled={loading}
                            onPress={() => loadPage(page + 1)}
                        >
                            <Text>{loading ? 'Đang tải...' : 'Xem thêm'}</Text>
                        </Button>
                    ) : null}
                </ScrollView>
            )}
        </View>
    )
}

export default NotificationsPage
