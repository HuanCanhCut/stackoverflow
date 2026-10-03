import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/avatar'
import QuestionCard from '@/components/question-card'
import AnswerCard from '@/components/answer-card'
import EditProfileModal from '@/components/edit-profile-modal'
import { useAppDispatch, useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { setCurrentUser } from '@/redux/reducers/authSlice'
import { ArrowBigUp, LogOut, MessageSquare, MessageSquareText } from 'lucide-react-native'
import * as secureStorage from 'expo-secure-store'
import * as authServices from '@/services/authServices'
import * as userServices from '@/services/userServices'
import * as questionServices from '@/services/questionServices'
import * as meService from '@/services/meService'
import { useCallback, useEffect, useState } from 'react'
import handleApiError from '@/utils/handleApiError'
import { cn } from '@/lib/utils'
import { QuestionModel } from '@/types/model/question.type'
import { UserStats } from '@/types/model/user.type'
import { useFocusEffect, useRouter } from 'expo-router'

// 2400 -> 2.4k, 128 -> 128
const formatCount = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${value}`

type ProfileTab = 'questions' | 'answers' | 'saved'

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
    { key: 'questions', label: 'Câu hỏi' },
    { key: 'answers', label: 'Câu trả lời' },
    { key: 'saved', label: 'Đã lưu' },
]

// TODO: thay bằng danh sách thật khi có API (chỉ làm FE)
const TAB_EMPTY_TEXT: Record<ProfileTab, string> = {
    questions: 'Bạn chưa đăng câu hỏi nào',
    answers: 'Bạn chưa có câu trả lời nào',
    saved: 'Bạn chưa lưu câu hỏi nào',
}

type StatItemProps = {
    icon: React.ReactNode
    value: number
    label: string
}

const StatItem = ({ icon, value, label }: StatItemProps) => (
    <View className="flex-1 items-center gap-1">
        <View className="flex-row items-center gap-1">
            {icon}
            <Text className="text-xl font-bold">{formatCount(value)}</Text>
        </View>
        <Text className="text-xs text-muted-foreground uppercase">{label}</Text>
    </View>
)

const PER_PAGE = 10

type TabState = {
    items: QuestionModel[]
    page: number
    totalPages: number
    loading: boolean
    loaded: boolean
}

const EMPTY_TAB_STATE: TabState = { items: [], page: 0, totalPages: 0, loading: false, loaded: false }

const ProfilePage = () => {
    const currentUser = useAppSelector(selectCurrentUser)
    const dispatch = useAppDispatch()
    const router = useRouter()

    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    // Thống kê hiển thị ở đầu trang; null khi chưa tải xong lần đầu
    const [stats, setStats] = useState<UserStats | null>(null)
    const [activeTab, setActiveTab] = useState<ProfileTab>('questions')
    const [tabData, setTabData] = useState<Record<ProfileTab, TabState>>({
        questions: EMPTY_TAB_STATE,
        answers: EMPTY_TAB_STATE,
        saved: EMPTY_TAB_STATE,
    })

    const fetchTabPage = useCallback(
        (tab: ProfileTab, page: number) => {
            if (!currentUser) return Promise.reject(new Error('Chưa đăng nhập'))

            switch (tab) {
                case 'questions':
                    return userServices.getUserQuestions({ userId: currentUser.id, page, perPage: PER_PAGE })
                case 'answers':
                    return userServices.getUserAnswers({ userId: currentUser.id, page, perPage: PER_PAGE })
                case 'saved':
                    return questionServices.getSavedQuestions({ page, perPage: PER_PAGE })
            }
        },
        [currentUser],
    )

    const loadTab = useCallback(
        async (tab: ProfileTab, page: number) => {
            setTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], loading: true } }))

            try {
                const res = await fetchTabPage(tab, page)

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
        [fetchTabPage],
    )

    // Lần đầu mở một tab thì tải trang 1 (lazy load)
    useEffect(() => {
        const current = tabData[activeTab]
        if (!current.loaded && !current.loading) {
            loadTab(activeTab, 1)
        }
    }, [activeTab, tabData, loadTab])

    // Mỗi khi màn hình được focus: làm mới thống kê và buộc các tab tải lại dữ liệu mới nhất.
    // Reset về rỗng để lazy-load effect tải lại tab đang mở; các tab khác tải lại khi được mở.
    // (vd. sau khi xóa/đăng câu hỏi/câu trả lời ở màn chi tiết rồi quay lại)
    useFocusEffect(
        useCallback(() => {
            let ignore = false

            setTabData({
                questions: EMPTY_TAB_STATE,
                answers: EMPTY_TAB_STATE,
                saved: EMPTY_TAB_STATE,
            })

            const loadStats = async () => {
                try {
                    const res = await meService.getCurrentUser()

                    if (!ignore) {
                        setStats({
                            vote_count: res.data.vote_count,
                            question_count: res.data.question_count,
                            answer_count: res.data.answer_count,
                        })
                    }
                } catch (error) {
                    if (!ignore) handleApiError(error)
                }
            }

            loadStats()

            return () => {
                ignore = true
            }
        }, []),
    )

    const activeTabData = tabData[activeTab]
    const canLoadMore = activeTabData.loaded && activeTabData.page < activeTabData.totalPages

    const openQuestion = (id: number) => {
        router.push({ pathname: '/(public)/questions/[id]', params: { id } })
    }

    const handleLogout = async () => {
        if (isLoggingOut) return

        setIsLoggingOut(true)

        try {
            const accessToken = await secureStorage.getItemAsync('access_token')
            const refreshToken = await secureStorage.getItemAsync('refresh_token')

            // Thu hồi token phía server; nếu lỗi vẫn tiếp tục đăng xuất ở client
            try {
                await authServices.logout({ accessToken, refreshToken })
            } catch (error) {
                handleApiError(error)
            }

            await secureStorage.deleteItemAsync('access_token')
            await secureStorage.deleteItemAsync('refresh_token')

            // currentUser = null -> ProtectedLayout tự redirect về trang đăng nhập
            dispatch(setCurrentUser(null))
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="items-center p-4">
            {/* Avatar + thông tin cơ bản */}
            <Avatar uri={currentUser?.avatar_path} size={96} className="mt-4" />

            <Text className="mt-4 text-2xl font-bold">{currentUser?.full_name}</Text>

            {currentUser?.nickname ? (
                <Text className="mt-1 text-muted-foreground">@{currentUser.nickname}</Text>
            ) : null}

            {currentUser?.bio ? (
                <Text className="mt-3 text-center leading-6 text-muted-foreground">{currentUser.bio}</Text>
            ) : null}

            {/* Nút chỉnh sửa hồ sơ */}
            <Button variant="outline" size="sm" className="mt-4" onPress={() => setIsEditOpen(true)}>
                <Text>Chỉnh sửa hồ sơ</Text>
            </Button>

            {/* Modal chỉnh sửa hồ sơ: đổi ảnh đại diện, họ tên, username */}
            {currentUser ? (
                <EditProfileModal
                    visible={isEditOpen}
                    user={currentUser}
                    onClose={() => setIsEditOpen(false)}
                    onUpdated={(updatedUser) => dispatch(setCurrentUser(updatedUser))}
                />
            ) : null}

            {/* Thống kê tổng thể của người dùng hiện tại */}
            <View className="mt-6 w-full flex-row rounded-xl border border-border bg-white py-4">
                <StatItem
                    icon={<ArrowBigUp size={18} className="text-primary" />}
                    value={stats?.vote_count ?? 0}
                    label="Vote"
                />
                <View className="w-px bg-border" />
                <StatItem
                    icon={<MessageSquareText size={18} className="text-muted-foreground" />}
                    value={stats?.question_count ?? 0}
                    label="Câu hỏi"
                />
                <View className="w-px bg-border" />
                <StatItem
                    icon={<MessageSquare size={18} className="text-muted-foreground" />}
                    value={stats?.answer_count ?? 0}
                    label="Câu trả lời"
                />
            </View>

            {/* Đăng xuất */}
            <Button
                variant="outline"
                className="mt-6 w-full border-destructive"
                disabled={isLoggingOut}
                onPress={handleLogout}
            >
                <LogOut size={18} className="text-destructive" />
                <Text className="text-destructive">{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
            </Button>

            {/* Tabs: Câu hỏi / Câu trả lời / Đã lưu */}
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

                {/* Nội dung theo tab đang chọn */}
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
                                    <QuestionCard
                                        key={item.id}
                                        question={item}
                                        onPress={() => openQuestion(item.id)}
                                    />
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

export default ProfilePage
