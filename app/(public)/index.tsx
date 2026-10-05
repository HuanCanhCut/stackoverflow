import handleApiError from '@/utils/handleApiError'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as tagServices from '@/services/tagServices'
import { TagModel } from '@/types/model/tag.type'
import { cn } from '@/lib/utils'
import * as questionServices from '@/services/questionServices'
import { GetQuestionsResponse } from '@/types/api_response/question.type'
import { QuestionModel, VoteValue } from '@/types/model/question.type'
import { Card, CardContent } from '@/components/ui/card'
import MarkdownRenderer from '@/components/markdown-renderer'
import Avatar from '@/components/avatar'
import { ArrowDown, ArrowUp, Bookmark, MessageSquare } from 'lucide-react-native'
import { ACTIVE_COLOR, VoteType } from '@/components/post-item'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { toast } from 'sonner-native'

const PER_PAGE = 20

// Giống backend: vote lại cùng chiều thì bỏ vote, vote ngược chiều thì đổi vote
const getNextVote = (question: QuestionModel, type: VoteType) => {
    const previousVote = question.my_vote ?? 0
    const value: VoteValue = type === 'upvote' ? 1 : -1
    const nextVote: VoteValue = previousVote === value ? 0 : value

    return {
        my_vote: nextVote,
        vote_count: question.vote_count + nextVote - previousVote,
    }
}

const HomePage = () => {
    const router = useRouter()
    const currentUser = useAppSelector(selectCurrentUser)

    const [tags, setTags] = useState<TagModel[]>([])
    const [activeTag, setActiveTag] = useState<number | null>(null)
    const [questions, setQuestions] = useState<GetQuestionsResponse>()
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    // Dùng ref để chặn onEndReached gọi nhiều lần liên tiếp trước khi state isLoading kịp cập nhật
    const isFetchingRef = useRef(false)
    // Chặn double-tap vote trên cùng một câu hỏi khi request chưa xong
    const pendingVoteIds = useRef(new Set<number>())
    // Chặn double-tap lưu/bỏ lưu trên cùng một câu hỏi khi request chưa xong
    const pendingSaveIds = useRef(new Set<number>())
    // Vị trí x của từng tag trên thanh lọc, để cuộn tới tag được chọn từ card câu hỏi
    const tagBarRef = useRef<ScrollView>(null)
    const tagOffsets = useRef(new Map<number, number>())
    const questionListRef = useRef<FlatList<QuestionModel>>(null)

    useEffect(() => {
        const getTags = async () => {
            try {
                const { data } = await tagServices.getTags({
                    search: '',
                })

                setTags(data)
            } catch (error) {
                handleApiError(error)
            }
        }

        getTags()
    }, [])

    // Tải lại trang đầu mỗi khi màn hình được focus (quay lại từ trang chi tiết)
    // hoặc khi đổi tag, để số liệu như số câu trả lời luôn mới nhất
    useFocusEffect(
        useCallback(() => {
            let ignore = false

            const getFirstPage = async () => {
                try {
                    isFetchingRef.current = true
                    setIsLoading(true)

                    const res = await questionServices.getQuestions({
                        page: 1,
                        perPage: PER_PAGE,
                        tagId: activeTag ?? undefined,
                    })

                    if (!ignore) {
                        setQuestions(res)
                        setPage(1)
                    }
                } catch (error) {
                    if (!ignore) {
                        handleApiError(error)
                    }
                } finally {
                    if (!ignore) {
                        isFetchingRef.current = false
                        setIsLoading(false)
                    }
                }
            }

            getFirstPage()

            return () => {
                ignore = true
            }
        }, [activeTag]),
    )

    // Các trang sau (cuộn tới đáy) thì nối data vào cuối, meta lấy theo trang mới nhất
    useEffect(() => {
        if (page === 1) return

        let ignore = false

        const getMore = async () => {
            try {
                isFetchingRef.current = true
                setIsLoading(true)

                const res = await questionServices.getQuestions({
                    page,
                    perPage: PER_PAGE,
                    tagId: activeTag ?? undefined,
                })

                if (!ignore) {
                    setQuestions((prev) => (prev ? { ...res, data: [...prev.data, ...res.data] } : res))
                }
            } catch (error) {
                if (!ignore) {
                    handleApiError(error)
                }
            } finally {
                if (!ignore) {
                    isFetchingRef.current = false
                    setIsLoading(false)
                }
            }
        }

        getMore()

        return () => {
            ignore = true
        }
    }, [page, activeTag])

    const loadMore = () => {
        if (isFetchingRef.current || !questions || page >= questions.meta.pagination.total_pages) {
            return
        }

        setPage((prev) => prev + 1)
    }

    // Đổi tag đang lọc, luôn quay về trang 1 để tải lại danh sách theo tag mới
    const selectTag = (tagId: number | null) => {
        if (tagId === activeTag) return

        setActiveTag(tagId)
        setPage(1)
        questionListRef.current?.scrollToOffset({ offset: 0, animated: false })

        // Cuộn thanh tag để tag vừa chọn nằm trong tầm nhìn (lùi 16px cho khỏi sát mép)
        const offset = tagId === null ? 0 : tagOffsets.current.get(tagId)
        if (offset !== undefined) {
            tagBarRef.current?.scrollTo({ x: Math.max(0, offset - 16), animated: true })
        }
    }

    // Cập nhật một câu hỏi trong danh sách hiện tại theo id
    const updateQuestion = (id: number, changes: Partial<QuestionModel>) => {
        setQuestions((prev) =>
            prev ? { ...prev, data: prev.data.map((q) => (q.id === id ? { ...q, ...changes } : q)) } : prev,
        )
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

    const handleVote = async (question: QuestionModel, type: VoteType) => {
        if (!requireLogin() || pendingVoteIds.current.has(question.id)) return

        pendingVoteIds.current.add(question.id)

        // Cập nhật lạc quan, nếu lỗi thì trả lại giá trị cũ
        const previous = { my_vote: question.my_vote ?? 0, vote_count: question.vote_count }
        updateQuestion(question.id, getNextVote(question, type))

        try {
            const { data } = await questionServices.voteQuestion({ id: question.id, type })

            updateQuestion(question.id, { my_vote: data.my_vote, vote_count: data.vote_count })
        } catch (error) {
            updateQuestion(question.id, previous)
            handleApiError(error)
        } finally {
            pendingVoteIds.current.delete(question.id)
        }
    }

    const handleToggleSave = async (question: QuestionModel) => {
        if (!requireLogin() || pendingSaveIds.current.has(question.id)) return

        pendingSaveIds.current.add(question.id)

        // Cập nhật lạc quan, nếu lỗi thì trả lại trạng thái cũ
        const wasSaved = !!question.is_saved
        updateQuestion(question.id, { is_saved: !wasSaved })

        try {
            if (wasSaved) {
                await questionServices.unsaveQuestion(question.id)
            } else {
                await questionServices.saveQuestion(question.id)
                toast.success('Đã lưu câu hỏi')
            }
        } catch (error) {
            updateQuestion(question.id, { is_saved: wasSaved })
            handleApiError(error)
        } finally {
            pendingSaveIds.current.delete(question.id)
        }
    }

    return (
        <View className="flex-1 p-2 gap-4 justify-start">
            <ScrollView
                ref={tagBarRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="grow-0"
                contentContainerStyle={{
                    gap: 8,
                    alignSelf: 'flex-start',
                }}
            >
                {/* Tất cả */}
                <Pressable
                    onPress={() => selectTag(null)}
                    className={cn('px-3 py-2 rounded-lg bg-white items-center justify-center', {
                        'bg-primary': activeTag === null,
                    })}
                >
                    <Text
                        className={cn('text-black', {
                            'text-white': activeTag === null,
                        })}
                    >
                        Tất cả
                    </Text>
                </Pressable>

                {/* Tags */}
                {tags.map((tag: TagModel) => (
                    <Pressable
                        key={tag.id}
                        onPress={() => selectTag(tag.id)}
                        onLayout={(e) => tagOffsets.current.set(tag.id, e.nativeEvent.layout.x)}
                        className={cn('px-3 py-2 rounded-lg bg-white', {
                            'bg-primary': activeTag === tag.id,
                        })}
                    >
                        <Text
                            className={cn('text-black', {
                                'text-white': activeTag === tag.id,
                            })}
                        >
                            {tag.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
            <FlatList
                ref={questionListRef}
                className="flex-1"
                data={questions?.data}
                keyExtractor={(item) => {
                    return item.id.toString()
                }}
                contentContainerClassName="gap-3 w-full"
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isLoading && page > 1 ? <ActivityIndicator size="small" className="my-3" /> : null}
                renderItem={({ item }) => {
                    return (
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: '/(public)/questions/[id]',
                                    params: { id: item.id },
                                })
                            }
                        >
                            <Card className="w-full px-0!">
                                <CardContent className="px-2">
                                    <View className="flex-row">
                                        <View className="pr-2 items-center">
                                            <Pressable className="p-2" onPress={() => handleVote(item, 'upvote')}>
                                                <ArrowUp color={item.my_vote === 1 ? ACTIVE_COLOR : undefined} />
                                            </Pressable>
                                            <Text
                                                className="text-3xl font-bold"
                                                style={item.my_vote ? { color: ACTIVE_COLOR } : undefined}
                                            >
                                                {item.vote_count}
                                            </Text>
                                            <Pressable className="p-2" onPress={() => handleVote(item, 'downvote')}>
                                                <ArrowDown color={item.my_vote === -1 ? ACTIVE_COLOR : undefined} />
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-2">
                                                <Avatar uri={item.author?.avatar_path} />
                                                <Text className="font-medium">{item.author?.full_name}</Text>
                                            </View>
                                            <Text className="mt-2 font-bold text-3xl line-clamp-3">{item.title}</Text>
                                            <MarkdownRenderer>{item.body}</MarkdownRenderer>
                                            <View className="mt-2 flex-row gap-2">
                                                {item.tags.map((tag) => {
                                                    return (
                                                        <Pressable
                                                            key={tag.tag_id}
                                                            onPress={() => selectTag(tag.tag_id)}
                                                            className={cn('bg-zinc-50 p-2 rounded-sm w-fit', {
                                                                'bg-primary/10': activeTag === tag.tag_id,
                                                            })}
                                                        >
                                                            <Text
                                                                className={cn('text-xs text-muted-foreground', {
                                                                    'text-primary': activeTag === tag.tag_id,
                                                                })}
                                                            >
                                                                {tag.tag.name}
                                                            </Text>
                                                        </Pressable>
                                                    )
                                                })}
                                            </View>
                                            <View className="flex-row gap-3 mt-3">
                                                <Pressable className="flex-row items-center gap-1">
                                                    <MessageSquare
                                                        size={16}
                                                        className="mt-0.75 text-muted-foreground"
                                                    ></MessageSquare>
                                                    <Text className="mb-1">{item.reply_count} câu trả lời</Text>
                                                </Pressable>

                                                <Pressable
                                                    className="mt-0.5 p-1"
                                                    onPress={() => handleToggleSave(item)}
                                                >
                                                    <Bookmark
                                                        size={16}
                                                        color={item.is_saved ? ACTIVE_COLOR : undefined}
                                                        fill={item.is_saved ? ACTIVE_COLOR : 'transparent'}
                                                    />
                                                </Pressable>
                                            </View>
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>
                        </Pressable>
                    )
                }}
            ></FlatList>
        </View>
    )
}

export default HomePage
