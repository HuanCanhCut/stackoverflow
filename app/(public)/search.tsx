import Header from '@/components/header'
import QuestionCard from '@/components/question-card'
import { useDebounce } from '@/hooks/use-debounce'
import { addSearchKeyword, clearSearchHistory, removeSearchKeyword } from '@/redux/reducers/searchHistorySlice'
import { useAppDispatch, useAppSelector } from '@/redux/redux.type'
import { selectSearchHistory } from '@/redux/selector'
import { getQuestions } from '@/services/questionServices'
import { GetQuestionsResponse } from '@/types/api_response/question.type'
import handleApiError from '@/utils/handleApiError'
import { useRouter } from 'expo-router'
import { ChevronRight, Clock, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

// Số câu hỏi hiển thị trước khi bấm "Xem tất cả"
const PREVIEW_LIMIT = 5

const SearchPage = () => {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const searchHistory = useAppSelector(selectSearchHistory)

    const [query, setQuery] = useState('')
    const [questions, setQuestions] = useState<GetQuestionsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const debouncedQuery = useDebounce(query.trim(), 500)

    useEffect(() => {
        if (!debouncedQuery) {
            return
        }

        // Bỏ qua kết quả của request cũ (race condition): khi debouncedQuery đổi hoặc unmount,
        // cleanup set ignore = true nên response trả về muộn sẽ không ghi đè state mới
        let ignore = false

        const searchQuestions = async () => {
            try {
                setIsLoading(true)

                const res = await getQuestions({ search: debouncedQuery, perPage: PREVIEW_LIMIT })

                if (!ignore) {
                    setQuestions(res)
                }
            } catch (error) {
                if (!ignore) {
                    handleApiError(error)
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        searchQuestions()

        return () => {
            // Đánh dấu request của lần chạy này đã cũ
            ignore = true
        }
    }, [debouncedQuery])

    const saveKeyword = () => {
        dispatch(addSearchKeyword(query))
    }

    const openQuestion = (id: number) => {
        saveKeyword()

        router.push({
            pathname: '/(public)/questions/[id]',
            params: {
                id,
            },
        })
    }

    const openAllResults = () => {
        saveKeyword()

        router.push({
            pathname: '/(public)/search-results',
            params: {
                q: debouncedQuery,
            },
        })
    }

    const showLoading = isLoading && !!debouncedQuery

    const renderRecentSearches = () => {
        if (searchHistory.length === 0) {
            return <Text className="mt-10 text-center text-slate-500">Nhập từ khoá để tìm kiếm câu hỏi</Text>
        }

        return (
            <View className="px-4 pt-4">
                <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-slate-900">Tìm kiếm gần đây</Text>

                    <Pressable onPress={() => dispatch(clearSearchHistory())} hitSlop={8}>
                        <Text className="text-sm text-slate-500">Xoá tất cả</Text>
                    </Pressable>
                </View>

                {searchHistory.map((keyword) => (
                    <Pressable
                        key={keyword}
                        onPress={() => setQuery(keyword)}
                        className="flex-row items-center gap-3 rounded-lg px-1 py-2.5 active:bg-slate-50"
                    >
                        <Clock size={16} color="#94a3b8" />

                        <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                            {keyword}
                        </Text>

                        <Pressable
                            onPress={() => dispatch(removeSearchKeyword(keyword))}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`Xoá ${keyword}`}
                        >
                            <X size={16} color="#94a3b8" />
                        </Pressable>
                    </Pressable>
                ))}
            </View>
        )
    }

    const renderEmpty = () => {
        if (showLoading) {
            return null
        }

        return <Text className="mt-10 text-center text-slate-500">Không tìm thấy câu hỏi nào</Text>
    }

    const renderFooter = () => {
        const total = questions?.meta.pagination.total ?? 0

        if (showLoading || total <= PREVIEW_LIMIT) {
            return null
        }

        return (
            <Pressable
                onPress={openAllResults}
                className="flex-row items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50"
            >
                <Text className="text-sm font-medium text-slate-900">Xem tất cả ({total})</Text>
                <ChevronRight size={16} color="#0f172a" />
            </Pressable>
        )
    }

    return (
        <View className="flex-1 bg-slate-50">
            <Header variant="search" searchValue={query} onSearchChange={setQuery} onSearchSubmit={saveKeyword} />

            {!debouncedQuery ? (
                renderRecentSearches()
            ) : (
                <>
                    {showLoading && (
                        <View className="py-3">
                            <ActivityIndicator size="small" />
                        </View>
                    )}

                    <FlatList
                        data={questions?.data}
                        keyExtractor={(item) => item.id.toString()}
                        // Khi bàn phím đang mở, chạm vào item sẽ chạy onPress ngay
                        keyboardShouldPersistTaps="handled"
                        contentContainerClassName="gap-3 p-4"
                        ListEmptyComponent={renderEmpty}
                        ListFooterComponent={renderFooter}
                        renderItem={({ item }) => (
                            <QuestionCard question={item} onPress={() => openQuestion(item.id)} />
                        )}
                    />
                </>
            )}
        </View>
    )
}

export default SearchPage
