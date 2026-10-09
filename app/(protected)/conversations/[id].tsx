import Avatar from '@/components/avatar'
import { Spinner } from '@/components/ui/spinner'
import { useOpenProfile } from '@/hooks/use-open-profile'
import { socket } from '@/lib/socket'
import { uploadImages } from '@/lib/upload'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import * as conversationServices from '@/services/conversationServices'
import { S3Folder } from '@/types/model/attachment.type'
import { ConversationModel, MessageModel } from '@/types/model/conversation.type'
import { MessageCreatedPayload, SocketEvent } from '@/types/socket.type'
import handleApiError from '@/utils/handleApiError'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ImagePlus, SendHorizontal, X } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import ImageView from '@/components/image-viewer'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const PAGE_LIMIT = 30
const MAX_IMAGES = 10
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const formatTime = (date: string) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

type MessageBubbleProps = {
    message: MessageModel
    isMine: boolean
    onPressImage: (images: { uri: string }[], index: number) => void
}

const MessageBubble = ({ message, isMine, onPressImage }: MessageBubbleProps) => {
    const images = message.attachments.map((attachment) => ({ uri: attachment.url }))

    return (
        <View className={cn('max-w-[80%] gap-1', isMine ? 'self-end items-end' : 'self-start items-start')}>
            {images.length > 0 && (
                <View className={cn('flex-row flex-wrap gap-1', isMine && 'justify-end')}>
                    {images.map((image, index) => (
                        <Pressable key={image.uri} onPress={() => onPressImage(images, index)}>
                            <Image
                                source={image}
                                style={{ width: 160, height: 160, borderRadius: 12 }}
                                contentFit="cover"
                            />
                        </Pressable>
                    ))}
                </View>
            )}

            {message.content ? (
                <View className={cn('rounded-2xl px-3 py-2', isMine ? 'bg-primary' : 'bg-slate-100')}>
                    <Text className={cn('text-base leading-5', isMine ? 'text-white' : 'text-slate-900')}>
                        {message.content}
                    </Text>
                </View>
            ) : null}

            <Text className="text-[11px] text-slate-400">{formatTime(message.created_at)}</Text>
        </View>
    )
}

/** Màn hình chat 1-1. Tin nhắn mới nhận realtime qua socket (sự kiện message:created) */
const ConversationPage = () => {
    const router = useRouter()
    const openProfile = useOpenProfile()
    const { id } = useLocalSearchParams<{ id: string }>()
    const conversationId = Number(id)
    const currentUserId = useAppSelector(selectCurrentUser)?.id

    const [conversation, setConversation] = useState<ConversationModel | null>(null)
    // Sắp xếp từ mới tới cũ, khớp với FlatList inverted (tin mới nhất nằm dưới cùng)
    const [messages, setMessages] = useState<MessageModel[]>([])
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [content, setContent] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [viewer, setViewer] = useState<{ images: { uri: string }[]; index: number } | null>(null)

    // Chặn onEndReached gọi nhiều lần trước khi state isLoadingMore kịp cập nhật
    const isFetchingMoreRef = useRef(false)

    // Tin vừa gửi vừa nhận về từ response API vừa từ socket, nên bỏ qua nếu đã có
    const addMessage = useCallback((message: MessageModel) => {
        setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [message, ...prev]))
    }, [])

    const markAsRead = useCallback(() => {
        conversationServices.markConversationAsRead(conversationId).catch(() => {
            // Đánh dấu đã đọc lỗi không ảnh hưởng tới việc chat
        })
    }, [conversationId])

    // Tải thông tin hội thoại và trang tin nhắn mới nhất, đồng thời đánh dấu đã đọc
    useEffect(() => {
        let ignore = false

        const init = async () => {
            try {
                setIsLoading(true)

                const [conversationRes, messagesRes] = await Promise.all([
                    conversationServices.getConversation(conversationId),
                    conversationServices.getMessages({ conversationId, limit: PAGE_LIMIT }),
                ])

                if (ignore) return

                setConversation(conversationRes.data)
                // Gộp với tin có thể đã nhận qua socket trong lúc đang tải
                setMessages((prev) => {
                    const loadedIds = new Set(messagesRes.data.map((message) => message.id))

                    return [...prev.filter((message) => !loadedIds.has(message.id)), ...messagesRes.data]
                })
                setNextCursor(messagesRes.meta.pagination.next_cursor)
                markAsRead()
            } catch (error) {
                if (!ignore) handleApiError(error)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }

        init()

        return () => {
            ignore = true
        }
    }, [conversationId, markAsRead])

    // Nhận tin nhắn realtime của hội thoại đang mở; tin của người kia thì đánh dấu đã đọc luôn vì đang xem
    useEffect(() => {
        const handleMessageCreated = (payload: MessageCreatedPayload) => {
            if (payload.conversation_id !== conversationId) return

            addMessage(payload)

            if (payload.sender_id !== currentUserId) {
                markAsRead()
            }
        }

        socket.on(SocketEvent.MESSAGE_CREATED, handleMessageCreated)

        return () => {
            socket.off(SocketEvent.MESSAGE_CREATED, handleMessageCreated)
        }
    }, [conversationId, currentUserId, addMessage, markAsRead])

    // List inverted nên cuộn lên đầu (tin cũ) sẽ gọi onEndReached
    const loadOlderMessages = async () => {
        if (!nextCursor || isFetchingMoreRef.current) return

        isFetchingMoreRef.current = true
        setIsLoadingMore(true)

        try {
            const res = await conversationServices.getMessages({
                conversationId,
                cursor: nextCursor,
                limit: PAGE_LIMIT,
            })

            setMessages((prev) => [...prev, ...res.data])
            setNextCursor(res.meta.pagination.next_cursor)
        } catch (error) {
            handleApiError(error)
        } finally {
            isFetchingMoreRef.current = false
            setIsLoadingMore(false)
        }
    }

    const sendText = async () => {
        const text = content.trim()

        if (!text || isSending) return

        setIsSending(true)

        try {
            const res = await conversationServices.sendMessage({ conversationId, content: text })

            addMessage(res.data)
            setContent('')
        } catch (error) {
            handleApiError(error)
        } finally {
            setIsSending(false)
        }
    }

    // Chọn ảnh xong thì tải lên S3 và gửi luôn thành một tin nhắn chỉ có ảnh
    const sendImages = async () => {
        if (isSending) return

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permission.granted) {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để gửi ảnh.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES,
            quality: 0.8,
        })

        if (result.canceled) return

        if (result.assets.some((asset) => (asset.fileSize ?? 0) > MAX_IMAGE_SIZE_BYTES)) {
            Alert.alert('Ảnh quá lớn', 'Mỗi ảnh tối đa 5MB.')
            return
        }

        setIsSending(true)

        try {
            const uploadIds = await uploadImages(result.assets, S3Folder.MESSAGES)
            const res = await conversationServices.sendMessage({ conversationId, uploadIds })

            addMessage(res.data)
        } catch (error) {
            handleApiError(error)
        } finally {
            setIsSending(false)
        }
    }

    const partner = conversation?.partner
    const canSend = content.trim().length > 0 && !isSending

    // Chiều cao bàn phím tính từ đáy màn hình, còn màn này đã được SafeAreaView gốc chừa sẵn insets.bottom,
    // nên chỉ cần chèn thêm phần chênh lệch (cùng cách tính với ô bình luận ở màn chi tiết câu hỏi)
    const insets = useSafeAreaInsets()
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation()
    const keyboardSpacerStyle = useAnimatedStyle(() => ({
        height: Math.max(0, -keyboardHeight.value - insets.bottom),
    }))

    return (
        <View className="flex-1 bg-white">
            {/* Thay header mặc định bằng header có avatar + tên người đang chat */}
            <Stack.Screen options={{ headerShown: false }} />

            <View className="h-14 flex-row items-center gap-2 border-b border-[#e2e8f0] bg-white px-2">
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={8}
                    className="p-2"
                    accessibilityRole="button"
                    accessibilityLabel="Quay lại"
                >
                    <ArrowLeft color="#0f172a" size={22} />
                </Pressable>

                {partner && (
                    <Pressable
                        onPress={() => openProfile(partner.id)}
                        className="flex-1 flex-row items-center gap-2"
                        accessibilityRole="button"
                        accessibilityLabel={`Xem hồ sơ ${partner.full_name}`}
                    >
                        <Avatar uri={partner.avatar_path} size={36} />
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                                {partner.full_name}
                            </Text>
                            <Text className="text-xs text-slate-500" numberOfLines={1}>
                                @{partner.nickname}
                            </Text>
                        </View>
                    </Pressable>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator size="small" className="mt-10 flex-1" />
            ) : (
                <FlatList
                    inverted
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerClassName="gap-3 p-3"
                    keyboardShouldPersistTaps="handled"
                    onEndReached={loadOlderMessages}
                    onEndReachedThreshold={0.3}
                    // inverted: footer hiển thị ở phía trên cùng, đúng chỗ tin cũ đang tải thêm
                    ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" /> : null}
                    ListEmptyComponent={
                        // List inverted lật ngược cả phần empty nên phải lật lại cho đúng chiều chữ
                        <View style={{ transform: [{ scaleY: -1 }] }} className="items-center gap-2 py-10">
                            {partner && <Avatar uri={partner.avatar_path} size={64} />}
                            <Text className="text-center text-slate-500">
                                Hãy gửi lời chào tới {partner?.full_name ?? 'người này'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <MessageBubble
                            message={item}
                            isMine={item.sender_id === currentUserId}
                            onPressImage={(images, index) => setViewer({ images, index })}
                        />
                    )}
                />
            )}

            <View className="flex-row items-end gap-2 border-t border-[#e2e8f0] bg-white px-2 py-2">
                <Pressable
                    onPress={sendImages}
                    disabled={isSending}
                    hitSlop={4}
                    className="h-10 w-9 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Gửi ảnh"
                >
                    <ImagePlus color="#64748b" size={22} />
                </Pressable>

                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    maxLength={5000}
                    className="max-h-28 min-h-10 flex-1 rounded-2xl border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-base leading-5 text-foreground"
                />

                <Pressable
                    onPress={sendText}
                    disabled={!canSend}
                    className={cn('h-10 w-10 items-center justify-center rounded-full bg-primary', {
                        'opacity-40': !canSend,
                    })}
                    accessibilityRole="button"
                    accessibilityLabel="Gửi tin nhắn"
                >
                    {isSending ? <Spinner color="#ffffff" /> : <SendHorizontal color="#ffffff" size={18} />}
                </Pressable>
            </View>

            {/* Khoảng trống cao bằng phần bàn phím đè lên màn hình: đẩy ô nhập lên và thu nhỏ danh sách tin nhắn */}
            <Animated.View style={keyboardSpacerStyle} />

            <ImageView
                images={viewer?.images ?? []}
                imageIndex={viewer?.index ?? 0}
                visible={viewer !== null}
                onRequestClose={() => setViewer(null)}
                HeaderComponent={() => (
                    <SafeAreaView edges={['top']} className="flex-row justify-end p-3">
                        <Pressable
                            onPress={() => setViewer(null)}
                            hitSlop={12}
                            className="rounded-full bg-black/40 p-2"
                        >
                            <X size={20} color="#fff" />
                        </Pressable>
                    </SafeAreaView>
                )}
            />
        </View>
    )
}

export default ConversationPage
