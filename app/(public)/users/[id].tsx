import AnswerCard from '@/components/answer-card'
import Avatar from '@/components/avatar'
import QuestionCard from '@/components/question-card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import * as conversationServices from '@/services/conversationServices'
import * as userServices from '@/services/userServices'
import { QuestionModel } from '@/types/model/question.type'
import { UserModel, UserStats } from '@/types/model/user.type'
import handleApiError from '@/utils/handleApiError'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowBigUp, MessageCircle, MessageSquare, MessageSquareText } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { toast } from 'sonner-native'

// 2400 -> 2.4k, 128 -> 128
const formatCount = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${value}`

type ProfileTab = 'questions' | 'answers'

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
    { key: 'questions', label: 'Câu hỏi' },
    { key: 'answers', label: 'Câu trả lời' },
]

const TAB_EMPTY_TEXT: Record<ProfileTab, string> = {
    questions: 'Chưa đăng câu hỏi nào',
    answers: 'Chưa có câu trả lời nào',
}

const PER_PAGE = 10

type TabState = {
    items: QuestionModel[]
    page: number
    totalPages: number
    loading: boolean
    loaded: boolean
}

const EMPTY_TAB_STATE: TabState = { items: [], page: 0, totalPages: 0, loading: false, loaded: false }

const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
    <View className="flex-1 items-center gap-1">
        <View className="flex-row items-center gap-1">
            {icon}
            <Text className="text-xl font-bold">{formatCount(value)}</Text>
        </View>
        <Text className="text-xs text-muted-foreground uppercase">{label}</Text>
    </View>
)

/** Hồ sơ công khai của người dùng khác, có nút nhắn tin */
const UserProfilePage = () => {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    const userId = Number(id)
    const currentUser = useAppSelector(selectCurrentUser)

    const [user, setUser] = useState<(UserModel & UserStats) | null>(null)
    const [isLoadingUser, setIsLoadingUser] = useState(true)
    const [isOpeningChat, setIsOpeningChat] = useState(false)
    const [activeTab, setActiveTab] = useState<ProfileTab>('questions')
    const [tabData, setTabData] = useState<Record<ProfileTab, TabState>>({
        questions: EMPTY_TAB_STATE,
        answers: EMPTY_TAB_STATE,
    })

    useEffect(() => {
        let ignore = false

        const loadUser = async () => {
            try {
                setIsLoadingUser(true)
                const res = await userServices.getUser(userId)
                if (!ignore) setUser(res.data)
            } catch (error) {
                if (!ignore) handleApiError(error)
            } finally {
                if (!ignore) setIsLoadingUser(false)
            }
        }

        loadUser()

        return () => {
            ignore = true
        }
    }, [userId])

    const loadTab = useCallback(
        async (tab: ProfileTab, page: number) => {
            setTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], loading: true } }))

            try {
                const fetcher = tab === 'questions' ? userServices.getUserQuestions : userServices.getUserAnswers
                const res = await fetcher({ userId, page, perPage: PER_PAGE })

                setTabData((prev) => ({
                    ...prev,
                    [tab]: {
                        // Trang 1 thay mới, các trang sau nối vào cuối
                        items: page === 1 ? res.data : [...prev[tab].items, ...res.data],
                        page,
                        totalPages: res.meta.pagination.total_pages,
                        loading: false,
                        loaded: true,
                    },
                }))
            } catch (error) {
                handleApiError(error)
                setTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], loading: false, loaded: true } }))
            }
        },
        [userId],
    )

    // Lần đầu mở một tab thì tải trang 1 (lazy load)
    useEffect(() => {
        const current = tabData[activeTab]
        if (!current.loaded && !current.loading) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadTab(activeTab, 1)
        }
    }, [activeTab, tabData, loadTab])

    // Bấm "Nhắn tin": tạo (hoặc lấy lại) hội thoại rồi mở màn chat
    const openChat = async () => {
        if (!currentUser) {
            const toastId = toast.info('Bạn cần đăng nhập để nhắn tin', {
                action: {
                    label: 'Đăng nhập',
                    onClick: () => {
                        toast.dismiss(toastId)
                        router.push('/(auth)/login')
                    },
                },
            })
            return
        }

        setIsOpeningChat(true)

        try {
            const res = await conversationServices.findOrCreateConversation(userId)

            router.push({ pathname: '/(protected)/conversations/[id]', params: { id: res.data.id } })
        } catch (error) {
            handleApiError(error)
        } finally {
            setIsOpeningChat(false)
        }
    }

    const openQuestion = (questionId: number) => {
        router.push({ pathname: '/(public)/questions/[id]', params: { id: questionId } })
    }

    // Mở hồ sơ của chính mình thì chuyển sang trang cá nhân (có chỉnh sửa, đăng xuất...)
    if (currentUser && currentUser.id === userId) {
        return <Redirect href="/(protected)/profile" />
    }

    if (isLoadingUser) {
        return <ActivityIndicator size="small" className="mt-10" />
    }

    if (!user) {
        return <Text className="mt-10 text-center text-muted-foreground">Không tìm thấy người dùng</Text>
    }

    const activeTabData = tabData[activeTab]
    const canLoadMore = activeTabData.loaded && activeTabData.page < activeTabData.totalPages

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="items-center p-4">
            <Avatar uri={user.avatar_path} size={96} className="mt-4" />

            <Text className="mt-4 text-2xl font-bold">{user.full_name}</Text>

            {user.nickname ? <Text className="mt-1 text-muted-foreground">@{user.nickname}</Text> : null}

            {user.bio ? <Text className="mt-3 text-center leading-6 text-muted-foreground">{user.bio}</Text> : null}

            <Button size="sm" className="mt-4" disabled={isOpeningChat} onPress={openChat}>
                {isOpeningChat ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <MessageCircle size={16} color="#ffffff" />
                )}
                <Text>Nhắn tin</Text>
            </Button>

            <View className="mt-6 w-full flex-row rounded-xl border border-border bg-white py-4">
                <StatItem
                    icon={<ArrowBigUp size={18} className="text-primary" />}
                    value={user.vote_count}
                    label="Vote"
                />
                <View className="w-px bg-border" />
                <StatItem
                    icon={<MessageSquareText size={18} className="text-muted-foreground" />}
                    value={user.question_count}
                    label="Câu hỏi"
                />
                <View className="w-px bg-border" />
                <StatItem
                    icon={<MessageSquare size={18} className="text-muted-foreground" />}
                    value={user.answer_count}
                    label="Câu trả lời"
                />
            </View>

            <View className="mt-6 w-full">
                <View className="flex-row border-b border-border">
                    {PROFILE_TABS.map((tab) => {
                        const isActive = tab.key === activeTab

                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                className={cn('flex-1 items-center pb-3', isActive && 'border-b-2 border-primary')}
                            >
                                <Text
                                    className={cn(
                                        'text-sm',
                                        isActive ? 'font-semibold text-primary' : 'text-muted-foreground',
                                    )}
                                >
                                    {tab.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>

                <View className="gap-3 pt-4">
                    {!activeTabData.loaded && activeTabData.loading ? (
                        <ActivityIndicator size="small" className="mt-10" />
                    ) : activeTabData.items.length === 0 ? (
                        <Text className="mt-10 text-center text-muted-foreground">{TAB_EMPTY_TEXT[activeTab]}</Text>
                    ) : (
                        <>
                            {activeTabData.items.map((item) =>
                                activeTab === 'answers' ? (
                                    <AnswerCard
                                        key={item.id}
                                        answer={item}
                                        // Mở câu hỏi gốc chứa câu trả lời này
                                        onPress={() => openQuestion(item.root_question_id ?? item.id)}
                                    />
                                ) : (
                                    <QuestionCard key={item.id} question={item} onPress={() => openQuestion(item.id)} />
                                ),
                            )}

                            {canLoadMore ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 self-center"
                                    disabled={activeTabData.loading}
                                    onPress={() => loadTab(activeTab, activeTabData.page + 1)}
                                >
                                    <Text>{activeTabData.loading ? 'Đang tải...' : 'Xem thêm'}</Text>
                                </Button>
                            ) : null}
                        </>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default UserProfilePage
