import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { ArrowDown, ArrowUp, Bookmark, MessageSquare } from 'lucide-react-native'
import * as questionServices from '@/services/questionServices'
import { QuestionModel, VoteValue } from '@/types/model/question.type'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import MarkdownRenderer from '@/components/markdown-renderer'
import Avatar from '@/components/avatar'
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

const ACTIVE_COLOR = '#f97316'
const INACTIVE_COLOR = '#0f172a'

type VoteType = 'upvote' | 'downvote'

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

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type PostItemProps = {
    post: QuestionModel
    isQuestion?: boolean
    onVote: (post: QuestionModel, type: VoteType) => void
    onToggleSave?: () => void
}

const PostItem = ({ post, isQuestion = false, onVote, onToggleSave }: PostItemProps) => {
    const upvoted = post.my_vote === 1
    const downvoted = post.my_vote === -1

    return (
        <Card className="w-full px-0!">
            <CardContent className="px-2">
                <View className="flex-row">
                    <View className="pr-2 items-center">
                        <Pressable
                            className="p-2"
                            onPress={() => onVote(post, 'upvote')}
                            accessibilityRole="button"
                            accessibilityLabel="Upvote"
                            accessibilityState={{ selected: upvoted }}
                        >
                            <ArrowUp color={upvoted ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth={upvoted ? 3 : 2} />
                        </Pressable>
                        <Text
                            className={cn('font-bold', isQuestion ? 'text-3xl' : 'text-2xl')}
                            style={post.my_vote ? { color: ACTIVE_COLOR } : undefined}
                        >
                            {post.vote_count}
                        </Text>
                        <Pressable
                            className="p-2"
                            onPress={() => onVote(post, 'downvote')}
                            accessibilityRole="button"
                            accessibilityLabel="Downvote"
                            accessibilityState={{ selected: downvoted }}
                        >
                            <ArrowDown
                                color={downvoted ? ACTIVE_COLOR : INACTIVE_COLOR}
                                strokeWidth={downvoted ? 3 : 2}
                            />
                        </Pressable>
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Avatar uri={post.author?.avatar_path} />
                            <View className="flex-1">
                                <Text className="font-medium">{post.author?.full_name}</Text>
                                <Text className="text-xs text-muted-foreground">{formatDate(post.created_at)}</Text>
                            </View>
                        </View>
                        {isQuestion && <Text className="mt-2 font-bold text-3xl">{post.title}</Text>}
                        <MarkdownRenderer>{post.body}</MarkdownRenderer>
                        {post.tags.length > 0 && (
                            <View className="mt-2 flex-row flex-wrap gap-2">
                                {post.tags.map((tag) => {
                                    return (
                                        <View key={tag.tag_id} className="bg-zinc-50 p-2 rounded-sm w-fit ">
                                            <Text className="text-xs text-muted-foreground">{tag.tag.name}</Text>
                                        </View>
                                    )
                                })}
                            </View>
                        )}
                        {isQuestion && (
                            <View className="flex-row gap-3 mt-3">
                                <View className="flex-row items-center gap-1">
                                    <MessageSquare size={16} className="mt-0.75 text-muted-foreground"></MessageSquare>
                                    <Text className="mb-1">{post.reply_count ?? 0} câu trả lời</Text>
                                </View>

                                <Pressable
                                    className="mt-0.5 flex-row items-center gap-1 p-1"
                                    onPress={onToggleSave}
                                    accessibilityRole="button"
                                    accessibilityLabel={post.is_saved ? 'Bỏ lưu' : 'Lưu bài viết'}
                                    accessibilityState={{ selected: !!post.is_saved }}
                                >
                                    <Bookmark
                                        size={16}
                                        color={post.is_saved ? ACTIVE_COLOR : INACTIVE_COLOR}
                                        fill={post.is_saved ? ACTIVE_COLOR : 'transparent'}
                                    />
                                    <Text className="mb-1">{post.is_saved ? 'Đã lưu' : 'Lưu'}</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </CardContent>
        </Card>
    )
}

const QuestionDetailPage = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const questionId = Number(id)
    const router = useRouter()
    const currentUser = useAppSelector(selectCurrentUser)

    const [question, setQuestion] = useState<QuestionModel>()
    const [replies, setReplies] = useState<QuestionModel[]>([])
    const [orderBy, setOrderBy] = useState<OrderBy>('newest')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loadingQuestion, setLoadingQuestion] = useState(true)
    const [loadingReplies, setLoadingReplies] = useState(false)

    // Chặn bấm liên tục khi request vote / lưu của cùng bài viết chưa xong
    const pendingVoteIds = useRef(new Set<number>())
    const pendingSave = useRef(false)

    // Bàn phím che cả bottom navigation + safe area đáy, nên khi mở chỉ cần đẩy thanh comment lên phần còn lại
    const insets = useSafeAreaInsets()
    const commentStickyOffset = { closed: 0, opened: BOTTOM_NAVIGATION_HEIGHT + insets.bottom }

    useEffect(() => {
        const getQuestion = async () => {
            try {
                setLoadingQuestion(true)
                const { data } = await questionServices.getQuestion(questionId)

                setQuestion(data)
            } catch (error) {
                handleApiError(error)
            } finally {
                setLoadingQuestion(false)
            }
        }

        getQuestion()
    }, [questionId])

    useEffect(() => {
        let ignore = false

        const getReplies = async () => {
            try {
                setLoadingReplies(true)
                const res = await questionServices.getQuestionReplies({
                    id: questionId,
                    orderBy,
                    page,
                    perPage: PER_PAGE,
                })

                if (ignore) return

                setReplies((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
                setTotalPages(res.meta.pagination.total_pages)
            } catch (error) {
                handleApiError(error)
            } finally {
                if (!ignore) setLoadingReplies(false)
            }
        }

        getReplies()

        return () => {
            ignore = true
        }
    }, [questionId, orderBy, page])

    const handleChangeOrder = (value: OrderBy) => {
        if (value === orderBy) return

        setReplies([])
        setPage(1)
        setOrderBy(value)
    }

    const handleLoadMore = () => {
        if (loadingReplies || page >= totalPages) return

        setPage((prev) => prev + 1)
    }

    const updatePost = useCallback((postId: number, changes: Partial<QuestionModel>) => {
        setQuestion((prev) => (prev?.id === postId ? { ...prev, ...changes } : prev))
        setReplies((prev) => prev.map((reply) => (reply.id === postId ? { ...reply, ...changes } : reply)))
    }, [])

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

    const handleSubmitReply = async (body: string) => {
        if (!question || !requireLogin()) return false

        try {
            const { data } = await questionServices.createQuestion({
                // Backend bắt buộc title cho mọi bài viết, câu trả lời dùng lại tiêu đề câu hỏi
                title: question.title.slice(0, 255),
                body,
                tags: [],
                uploadIds: [],
                parentId: question.id,
            })

            setReplies((prev) => [
                { ...data, author: currentUser ?? undefined, vote_count: 0, my_vote: 0, is_saved: false },
                ...prev,
            ])
            updatePost(question.id, { reply_count: (question.reply_count ?? 0) + 1 })

            return true
        } catch (error) {
            handleApiError(error)

            return false
        }
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
                data={replies}
                keyExtractor={(item) => item.id.toString()}
                contentContainerClassName="gap-3 w-full pb-4"
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    <View className="gap-4">
                        <PostItem post={question} isQuestion onVote={handleVote} onToggleSave={handleToggleSave} />

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
                renderItem={({ item }) => <PostItem post={item} onVote={handleVote} />}
                ListEmptyComponent={
                    loadingReplies ? null : (
                        <Text className="text-center text-muted-foreground py-6">Chưa có câu trả lời nào</Text>
                    )
                }
                ListFooterComponent={
                    loadingReplies ? (
                        <View className="py-4 items-center">
                            <Spinner />
                        </View>
                    ) : null
                }
            ></FlatList>

            <KeyboardStickyView offset={commentStickyOffset}>
                <CommentInput canComment={!!currentUser} onRequireLogin={requireLogin} onSubmit={handleSubmitReply} />
            </KeyboardStickyView>
        </View>
    )
}

export default QuestionDetailPage
