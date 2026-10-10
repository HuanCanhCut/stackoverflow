import Avatar from '@/components/avatar'
import { Input } from '@/components/ui/input'
import UserSearchList from '@/components/user-search-list'
import { socket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import * as conversationServices from '@/services/conversationServices'
import { ConversationModel, MessageModel } from '@/types/model/conversation.type'
import { UserModel } from '@/types/model/user.type'
import { SocketEvent } from '@/types/socket.type'
import formatRelativeTime from '@/utils/formatRelativeTime'
import handleApiError from '@/utils/handleApiError'
import { useFocusEffect, useRouter } from 'expo-router'
import { MessageCircleOff, Search, X } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

const PER_PAGE = 20

// Tin nhắn chỉ có ảnh thì hiển thị nhãn thay cho nội dung
const previewMessage = (message: MessageModel, isMine: boolean) => {
    const text = message.content ?? `[${message.attachments.length} hình ảnh]`

    return isMine ? `Bạn: ${text}` : text
}

/** Danh sách hội thoại, mới nhắn gần nhất lên đầu */
const ConversationsPage = () => {
    const router = useRouter()
    const currentUserId = useAppSelector(selectCurrentUser)?.id

    const [items, setItems] = useState<ConversationModel[]>([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // Có từ khóa thì thay danh sách hội thoại bằng kết quả tìm người để nhắn tin mới
    const [searchQuery, setSearchQuery] = useState('')
    const [openingUserId, setOpeningUserId] = useState<number | null>(null)
    const isSearchMode = searchQuery.trim().length > 0

    const isFetchingRef = useRef(false)

    const loadPage = useCallback(async (pageToLoad: number) => {
        isFetchingRef.current = true
        setIsLoading(true)

        try {
            const res = await conversationServices.getConversations({ page: pageToLoad, perPage: PER_PAGE })

            // Trang 1 thay mới, các trang sau nối vào cuối
            setItems((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]))
            setPage(pageToLoad)
            setTotalPages(res.meta.pagination.total_pages)
        } catch (error) {
            handleApiError(error)
        } finally {
            isFetchingRef.current = false
            setIsLoading(false)
            setLoaded(true)
        }
    }, [])

    // Mỗi lần quay lại màn hình thì tải lại để cập nhật tin mới / số chưa đọc
    useFocusEffect(
        useCallback(() => {
            loadPage(1)
        }, [loadPage]),
    )

    // Có tin nhắn mới ở bất kỳ hội thoại nào: tải lại trang đầu để đưa hội thoại đó lên trên cùng
    useEffect(() => {
        const handleMessageCreated = () => {
            loadPage(1)
        }

        socket.on(SocketEvent.MESSAGE_CREATED, handleMessageCreated)

        return () => {
            socket.off(SocketEvent.MESSAGE_CREATED, handleMessageCreated)
        }
    }, [loadPage])

    const refresh = async () => {
        setIsRefreshing(true)
        await loadPage(1)
        setIsRefreshing(false)
    }

    const loadMore = () => {
        if (isFetchingRef.current || page >= totalPages) return

        loadPage(page + 1)
    }

    // Chọn một người trong kết quả tìm kiếm: lấy hội thoại sẵn có hoặc tạo mới rồi mở màn chat.
    // Hội thoại mới tạo chưa có tin nhắn nên server không trả về trong danh sách cho tới khi nhắn tin đầu tiên
    const openChatWithUser = async (user: UserModel) => {
        if (openingUserId) return

        setOpeningUserId(user.id)

        try {
            const res = await conversationServices.findOrCreateConversation(user.id)

            setSearchQuery('')
            router.push({ pathname: '/(protected)/conversations/[id]', params: { id: res.data.id } })
        } catch (error) {
            handleApiError(error)
        } finally {
            setOpeningUserId(null)
        }
    }

    const renderItem = ({ item }: { item: ConversationModel }) => {
        const hasUnread = item.unread_count > 0

        return (
            <Pressable
                onPress={() => router.push({ pathname: '/(protected)/conversations/[id]', params: { id: item.id } })}
                className="flex-row items-center gap-3 bg-white px-4 py-3 active:bg-slate-50"
            >
                <Avatar uri={item.partner.avatar_path} size={48} />

                <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center justify-between gap-2">
                        <Text
                            className={cn('flex-1 text-base text-slate-900', hasUnread && 'font-bold')}
                            numberOfLines={1}
                        >
                            {item.partner.full_name}
                        </Text>

                        {item.last_message_at && (
                            <Text className="text-xs text-slate-400">{formatRelativeTime(item.last_message_at)}</Text>
                        )}
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Text
                            className={cn(
                                'flex-1 text-sm',
                                hasUnread ? 'font-semibold text-slate-900' : 'text-slate-500',
                            )}
                            numberOfLines={1}
                        >
                            {item.last_message
                                ? previewMessage(item.last_message, item.last_message.sender_id === currentUserId)
                                : ''}
                        </Text>

                        {hasUnread && (
                            <View className="min-w-5 items-center rounded-full bg-primary px-1.5 py-0.5">
                                <Text className="text-[11px] font-bold text-white">
                                    {item.unread_count > 99 ? '99+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        )
    }

    return (
        <View className="flex-1 bg-white">
            <Text className="px-4 pb-2 pt-4 text-xl font-bold text-slate-900">Tin nhắn</Text>

            <View className="mx-4 mb-2 justify-center">
                <View className="pointer-events-none absolute left-3 z-10">
                    <Search size={18} color="#94a3b8" />
                </View>

                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm người để nhắn tin..."
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    className="rounded-full bg-slate-100 pl-10 pr-10"
                />

                {isSearchMode && (
                    <Pressable
                        onPress={() => setSearchQuery('')}
                        hitSlop={8}
                        className="absolute right-3"
                        accessibilityRole="button"
                        accessibilityLabel="Xóa tìm kiếm"
                    >
                        <X size={18} color="#64748b" />
                    </Pressable>
                )}
            </View>

            {isSearchMode ? (
                <UserSearchList query={searchQuery} onSelect={openChatWithUser} openingUserId={openingUserId} />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View className="ml-[76px] h-px bg-slate-100" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshing={isRefreshing}
                    onRefresh={refresh}
                    ListEmptyComponent={
                        !loaded ? (
                            <ActivityIndicator size="small" className="mt-10" />
                        ) : (
                            <View className="mt-16 items-center gap-2 px-6">
                                <MessageCircleOff size={40} color="#94a3b8" />
                                <Text className="text-center text-slate-500">
                                    Chưa có tin nhắn nào. Tìm tên một người ở ô phía trên để bắt đầu trò chuyện
                                </Text>
                            </View>
                        )
                    }
                    ListFooterComponent={
                        isLoading && page > 0 ? <ActivityIndicator size="small" className="py-3" /> : null
                    }
                />
            )}
        </View>
    )
}

export default ConversationsPage
