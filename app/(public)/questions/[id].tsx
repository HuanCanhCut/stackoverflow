import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import * as questionServices from '@/services/questionServices'
import { QuestionModel, VoteValue } from '@/types/model/question.type'
import { GetQuestionRepliesResponse } from '@/types/api_response/question.type'
import { Spinner } from '@/components/ui/spinner'
import PostItem, { VoteType } from '@/components/post-item'
import CommentInput from '@/components/comment-input'
import { BOTTOM_NAVIGATION_HEIGHT } from '@/components/bottom-navigation'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import handleApiError from '@/utils/handleApiError'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { toast } from 'sonner-native'

const PER_PAGE = 10

// Comment lồng sâu hơn mức này thì không thụt lề thêm nữa (màn hình điện thoại hẹp),
// thay vào đó hiển thị "Trả lời <tên>" để biết đang trả lời ai
const MAX_INDENT_DEPTH = 3
const INDENT_SIZE = 16

// Giống backend: vote lại cùng chiều thì bỏ vote, vote ngược chiều thì đổi vote
const getNextVote = (post: QuestionModel, type: VoteType) => {
    const previousVote = post.my_vote ?? 0
    const value: VoteValue = type === 'upvote' ? 1 : -1
    const nextVote: VoteValue = previousVote === value ? 0 : value

    return {
        my_vote: nextVote,
        vote_count: post.vote_count + nextVote - previousVote,
    }
}

type OrderBy = 'newest' | 'vote'

const ORDER_OPTIONS: { value: OrderBy; label: string }[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'vote', label: 'Nhiều vote' },
]

/** Danh sách phản hồi con của một bài viết (câu hỏi hoặc comment) */
type Thread = {
    ids: number[]
    page: number
    totalPages: number
    loading: boolean
    expanded: boolean
}

const EMPTY_THREAD: Thread = { ids: [], page: 0, totalPages: 0, loading: false, expanded: false }

// Câu hỏi luôn mở danh sách câu trả lời, và đang tải trang đầu ngay khi vào trang
const initialThreads = (questionId: number): Record<number, Thread> => ({
    [questionId]: { ...EMPTY_THREAD, loading: true, expanded: true },
})

type Row =
    { type: 'post'; id: number; depth: number } | { type: 'more'; parentId: number; depth: number; loading: boolean }

const QuestionDetailPage = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const questionId = Number(id)
    const router = useRouter()
    const currentUser = useAppSelector(selectCurrentUser)

    // Lưu phẳng theo id để vote / cập nhật một comment ở bất kỳ cấp nào chỉ cần sửa 1 chỗ
    const [posts, setPosts] = useState<Record<number, QuestionModel>>({})
    const [threads, setThreads] = useState<Record<number, Thread>>(() => initialThreads(questionId))
    const [orderBy, setOrderBy] = useState<OrderBy>('newest')
    const [loadingQuestion, setLoadingQuestion] = useState(true)
    const [replyTo, setReplyTo] = useState<QuestionModel | null>(null)

    const question = posts[questionId] as QuestionModel | undefined
    const rootThread = threads[questionId] ?? EMPTY_THREAD

    // Tăng mỗi khi đổi cách sắp xếp để bỏ qua response của các lần tải phản hồi con / trang sau đang chạy
    const loadVersion = useRef(0)
    // Chặn bấm liên tục khi request vote / lưu của cùng bài viết chưa xong
    const pendingVoteIds = useRef(new Set<number>())
    const pendingSave = useRef(false)
    const pendingDeleteIds = useRef(new Set<number>())
    const commentInputRef = useRef<TextInput>(null)

    // Bàn phím che cả bottom navigation + safe area đáy, nên khi mở chỉ cần đẩy thanh comment lên phần còn lại
    const insets = useSafeAreaInsets()
    const commentStickyOffset = { closed: 0, opened: BOTTOM_NAVIGATION_HEIGHT + insets.bottom }

    const updatePost = useCallback((postId: number, changes: Partial<QuestionModel>) => {
        setPosts((prev) => (prev[postId] ? { ...prev, [postId]: { ...prev[postId], ...changes } } : prev))
    }, [])

    const updateThread = useCallback((parentId: number, changes: Partial<Thread>) => {
        setThreads((prev) => ({ ...prev, [parentId]: { ...(prev[parentId] ?? EMPTY_THREAD), ...changes } }))
    }, [])

    // Gộp 1 trang phản hồi vừa tải vào cây comment
    const applyReplies = useCallback((parentId: number, page: number, res: GetQuestionRepliesResponse) => {
        setPosts((prev) => {
            const next = { ...prev }
            res.data.forEach((reply) => {
                next[reply.id] = reply
            })
            return next
        })
        setThreads((prev) => {
            const thread = prev[parentId] ?? EMPTY_THREAD
            const knownIds = new Set(thread.ids)
            // Bỏ trùng: comment vừa gửi đã được chèn sẵn ở đầu danh sách
            const newIds = res.data.map((reply) => reply.id).filter((replyId) => !knownIds.has(replyId))

            return {
                ...prev,
                [parentId]: {
                    ...thread,
                    ids: [...thread.ids, ...newIds],
                    page,
                    totalPages: res.meta.pagination.total_pages,
                    loading: false,
                },
            }
        })
    }, [])

    const loadReplies = async (parentId: number, page: number) => {
        const version = loadVersion.current

        updateThread(parentId, { loading: true, expanded: true })

        try {
            const res = await questionServices.getQuestionReplies({ id: parentId, orderBy, page, perPage: PER_PAGE })

            if (version === loadVersion.current) applyReplies(parentId, page, res)
        } catch (error) {
            handleApiError(error)

            if (version === loadVersion.current) updateThread(parentId, { loading: false })
        }
    }

    // Tải lại mỗi khi màn hình được focus để cập nhật sau khi chỉnh sửa câu hỏi rồi quay về
    useFocusEffect(
        useCallback(() => {
            let ignore = false

            const getQuestion = async () => {
                try {
                    const { data } = await questionServices.getQuestion(questionId)

                    if (!ignore) setPosts((prev) => ({ ...prev, [data.id]: data }))
                } catch (error) {
                    handleApiError(error)
                } finally {
                    if (!ignore) setLoadingQuestion(false)
                }
            }

            getQuestion()

            return () => {
                ignore = true
            }
        }, [questionId]),
    )

    // Tải trang đầu khi vào trang / đổi cách sắp xếp
    useEffect(() => {
        let ignore = false

        const getReplies = async () => {
            try {
                const res = await questionServices.getQuestionReplies({
                    id: questionId,
                    orderBy,
                    page: 1,
                    perPage: PER_PAGE,
                })

                if (!ignore) applyReplies(questionId, 1, res)
            } catch (error) {
                handleApiError(error)

                if (!ignore) updateThread(questionId, { loading: false })
            }
        }

        getReplies()

        return () => {
            ignore = true
        }
    }, [questionId, orderBy, applyReplies, updateThread])

    const rows = useMemo(() => {
        const result: Row[] = []

        const appendThread = (parentId: number, depth: number) => {
            const thread = threads[parentId]
            if (!thread) return

            thread.ids.forEach((replyId) => {
                result.push({ type: 'post', id: replyId, depth })

                const childThread = threads[replyId]
                if (!childThread?.expanded) return

                appendThread(replyId, depth + 1)

                if (childThread.loading || childThread.page < childThread.totalPages) {
                    result.push({ type: 'more', parentId: replyId, depth: depth + 1, loading: childThread.loading })
                }
            })
        }

        appendThread(questionId, 0)

        return result
    }, [threads, questionId])

    const handleChangeOrder = (value: OrderBy) => {
        if (value === orderBy) return

        // Thứ tự thay đổi nên bỏ toàn bộ cây comment đã tải (kể cả request đang chạy), effect sẽ tải lại từ đầu
        loadVersion.current += 1
        setThreads(initialThreads(questionId))
        setOrderBy(value)
    }

    const handleLoadMore = () => {
        if (rootThread.loading || rootThread.page >= rootThread.totalPages) return

        loadReplies(questionId, rootThread.page + 1)
    }

    const handleLoadMoreChildren = (parentId: number) => {
        const thread = threads[parentId] ?? EMPTY_THREAD

        if (thread.loading) return

        loadReplies(parentId, thread.page + 1)
    }

    const handleToggleReplies = (post: QuestionModel) => {
        const thread = threads[post.id]

        if (thread?.expanded) {
            updateThread(post.id, { expanded: false })
        } else if (thread && thread.page > 0) {
            updateThread(post.id, { expanded: true })
        } else {
            loadReplies(post.id, 1)
        }
    }

    const requireLogin = () => {
        if (currentUser) return true

        const toastId = toast.info('Bạn cần đăng nhập để thực hiện thao tác này', {
            action: {
                label: 'Đăng nhập',
                onClick: () => {
                    toast.dismiss(toastId)
                    router.push('/(auth)/login')
                },
            },
        })

        return false
    }

    const handleVote = async (post: QuestionModel, type: VoteType) => {
        if (!requireLogin() || pendingVoteIds.current.has(post.id)) return

        pendingVoteIds.current.add(post.id)

        const previous = { my_vote: post.my_vote ?? 0, vote_count: post.vote_count }
        updatePost(post.id, getNextVote(post, type))

        try {
            const { data } = await questionServices.voteQuestion({ id: post.id, type })

            updatePost(post.id, { my_vote: data.my_vote, vote_count: data.vote_count })
        } catch (error) {
            updatePost(post.id, previous)
            handleApiError(error)
        } finally {
            pendingVoteIds.current.delete(post.id)
        }
    }

    const handleToggleSave = async () => {
        if (!question || !requireLogin() || pendingSave.current) return

        pendingSave.current = true

        const wasSaved = !!question.is_saved
        updatePost(question.id, { is_saved: !wasSaved })

        try {
            if (wasSaved) {
                await questionServices.unsaveQuestion(question.id)
            } else {
                await questionServices.saveQuestion(question.id)
                toast.success('Đã lưu bài viết')
            }
        } catch (error) {
            updatePost(question.id, { is_saved: wasSaved })
            handleApiError(error)
        } finally {
            pendingSave.current = false
        }
    }

    const handleEdit = () => {
        router.push({ pathname: '/(protected)/edit-question/[id]', params: { id: questionId } })
    }

    const deletePost = async (post: QuestionModel) => {
        if (pendingDeleteIds.current.has(post.id)) return

        pendingDeleteIds.current.add(post.id)

        try {
            await questionServices.deleteQuestion(post.id)

            if (post.id === questionId) {
                toast.success('Đã xóa câu hỏi')

                if (router.canGoBack()) {
                    router.back()
                } else {
                    router.replace('/(public)')
                }

                return
            }

            // Backend xóa cascade các phản hồi con, nên chỉ cần gỡ comment khỏi danh sách của comment cha
            const parentId = post.parent_id ?? questionId

            setPosts((prev) => {
                const { [post.id]: _deleted, ...rest } = prev
                const parent = rest[parentId]

                if (!parent) return rest

                return { ...rest, [parentId]: { ...parent, reply_count: Math.max((parent.reply_count ?? 1) - 1, 0) } }
            })
            setThreads((prev) => {
                const { [post.id]: _deleted, ...rest } = prev
                const parentThread = rest[parentId]

                if (!parentThread) return rest

                return {
                    ...rest,
                    [parentId]: { ...parentThread, ids: parentThread.ids.filter((replyId) => replyId !== post.id) },
                }
            })
            setReplyTo((prev) => (prev?.id === post.id ? null : prev))
            toast.success('Đã xóa câu trả lời')
        } catch (error) {
            handleApiError(error)
        } finally {
            pendingDeleteIds.current.delete(post.id)
        }
    }

    const handleDelete = (post: QuestionModel) => {
        const isQuestion = post.id === questionId

        Alert.alert(
            isQuestion ? 'Xóa câu hỏi' : 'Xóa câu trả lời',
            'Toàn bộ phản hồi bên trong cũng sẽ bị xóa. Bạn không thể hoàn tác thao tác này.',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => deletePost(post) },
            ],
        )
    }

    const handleReply = (post: QuestionModel) => {
        if (!requireLogin()) return

        setReplyTo(post)
        commentInputRef.current?.focus()
    }

    const handleSubmitReply = async (body: string) => {
        if (!question || !requireLogin()) return false

        const parent = replyTo ?? question

        try {
            const { data } = await questionServices.createQuestion({
                // Backend bắt buộc title cho mọi bài viết, câu trả lời dùng lại tiêu đề câu hỏi
                title: question.title.slice(0, 255),
                body,
                tags: [],
                uploadIds: [],
                parentId: parent.id,
            })

            const parentThread = threads[parent.id] ?? EMPTY_THREAD
            // Comment cha có phản hồi nhưng chưa tải lần nào: tải thêm để hiện cùng comment vừa gửi
            const shouldLoadSiblings =
                parent.id !== questionId && parentThread.page === 0 && (parent.reply_count ?? 0) > 0

            setPosts((prev) => ({
                ...prev,
                [data.id]: {
                    ...data,
                    author: currentUser ?? undefined,
                    vote_count: 0,
                    my_vote: 0,
                    is_saved: false,
                    reply_count: 0,
                },
                [parent.id]: { ...prev[parent.id], reply_count: (prev[parent.id]?.reply_count ?? 0) + 1 },
            }))
            setThreads((prev) => {
                const thread = prev[parent.id] ?? EMPTY_THREAD

                return { ...prev, [parent.id]: { ...thread, ids: [data.id, ...thread.ids], expanded: true } }
            })
            setReplyTo(null)

            if (shouldLoadSiblings) loadReplies(parent.id, 1)

            return true
        } catch (error) {
            handleApiError(error)

            return false
        }
    }

    const renderRow = ({ item }: { item: Row }) => {
        const indent = Math.min(item.depth, MAX_INDENT_DEPTH) * INDENT_SIZE
        const threadLineClassName = item.depth > 0 ? 'border-l-2 border-[#e2e8f0] pl-2' : undefined

        if (item.type === 'more') {
            return (
                <View style={{ marginLeft: indent }} className={threadLineClassName}>
                    {item.loading ? (
                        <View className="items-start py-2">
                            <Spinner />
                        </View>
                    ) : (
                        <Pressable className="py-2" onPress={() => handleLoadMoreChildren(item.parentId)}>
                            <Text className="text-sm font-medium text-muted-foreground">Xem thêm phản hồi</Text>
                        </Pressable>
                    )}
                </View>
            )
        }

        const post = posts[item.id]
        if (!post) return null

        const parentAuthor = post.parent_id ? posts[post.parent_id]?.author?.full_name : undefined

        return (
            <View style={{ marginLeft: indent }} className={threadLineClassName}>
                <PostItem
                    post={post}
                    onVote={handleVote}
                    onReply={handleReply}
                    onToggleReplies={handleToggleReplies}
                    onDelete={currentUser?.id === post.author_id ? handleDelete : undefined}
                    repliesExpanded={!!threads[post.id]?.expanded}
                    replyToName={item.depth > MAX_INDENT_DEPTH ? parentAuthor : undefined}
                />
            </View>
        )
    }

    if (loadingQuestion) {
        return (
            <View className="flex-1 items-center justify-center">
                <Spinner />
            </View>
        )
    }

    if (!question) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground">Không tìm thấy câu hỏi</Text>
            </View>
        )
    }

    return (
        <View className="flex-1">
            <FlatList
                className="flex-1 px-2 pt-2"
                keyboardShouldPersistTaps="handled"
                data={rows}
                keyExtractor={(item) => (item.type === 'post' ? `post-${item.id}` : `more-${item.parentId}`)}
                contentContainerClassName="gap-3 w-full pb-4"
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    <View className="gap-4">
                        <PostItem
                            post={question}
                            isQuestion
                            onVote={handleVote}
                            onToggleSave={handleToggleSave}
                            onEdit={currentUser?.id === question.author_id ? handleEdit : undefined}
                            onDelete={currentUser?.id === question.author_id ? handleDelete : undefined}
                        />

                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-bold">{question.reply_count ?? 0} câu trả lời</Text>
                            <View className="flex-row gap-2">
                                {ORDER_OPTIONS.map((option) => (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => handleChangeOrder(option.value)}
                                        className={cn('px-3 py-2 rounded-lg bg-white', {
                                            'bg-primary': orderBy === option.value,
                                        })}
                                    >
                                        <Text
                                            className={cn('text-black', {
                                                'text-white': orderBy === option.value,
                                            })}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                }
                renderItem={renderRow}
                ListEmptyComponent={
                    rootThread.loading ? null : (
                        <Text className="text-center text-muted-foreground py-6">Chưa có câu trả lời nào</Text>
                    )
                }
                ListFooterComponent={
                    rootThread.loading ? (
                        <View className="py-4 items-center">
                            <Spinner />
                        </View>
                    ) : null
                }
            ></FlatList>

            <KeyboardStickyView offset={commentStickyOffset}>
                <CommentInput
                    canComment={!!currentUser}
                    onRequireLogin={requireLogin}
                    onSubmit={handleSubmitReply}
                    replyingTo={replyTo?.author?.full_name ?? null}
                    onCancelReply={() => setReplyTo(null)}
                    inputRef={commentInputRef}
                />
            </KeyboardStickyView>
        </View>
    )
}

export default QuestionDetailPage
