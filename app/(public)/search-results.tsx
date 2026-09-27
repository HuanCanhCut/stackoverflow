import QuestionCard from '@/components/question-card'
import { getQuestions } from '@/services/questionServices'
import { GetQuestionsResponse } from '@/types/api_response/question.type'
import handleApiError from '@/utils/handleApiError'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

const PER_PAGE = 10

const SearchResultsPage = () => {
    const router = useRouter()
    const { q = '' } = useLocalSearchParams<{ q: string }>()

    const [questions, setQuestions] = useState<GetQuestionsResponse | null>(null)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    // Dùng ref để chặn onEndReached gọi nhiều lần liên tiếp trước khi state isLoading kịp cập nhật
    const isFetchingRef = useRef(false)

    useEffect(() => {
        let ignore = false

        const fetchQuestions = async () => {
            try {
                isFetchingRef.current = true
                setIsLoading(true)

                const res = await getQuestions({ search: q, page, perPage: PER_PAGE })

                if (!ignore) {
                    // Trang 1 thì thay mới, các trang sau thì nối data vào cuối, meta lấy theo trang mới nhất
                    setQuestions((prev) => (page === 1 || !prev ? res : { ...res, data: [...prev.data, ...res.data] }))
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

        fetchQuestions()

        return () => {
            ignore = true
        }
    }, [q, page])

    const loadMore = () => {
        if (isFetchingRef.current || !questions || page >= questions.meta.pagination.total_pages) {
            return
        }

        setPage((prev) => prev + 1)
    }

    const isFirstLoad = isLoading && page === 1

    return (
        <View className="flex-1 bg-slate-50">
            <FlatList
                data={questions?.data}
                keyExtractor={(item) => item.id.toString()}
                contentContainerClassName="gap-3 p-4"
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    <Text className="text-sm text-slate-500">
                        {isFirstLoad
                            ? 'Đang tìm kiếm...'
                            : `${questions?.meta.pagination.total ?? 0} kết quả cho "${q}"`}
                    </Text>
                }
                ListEmptyComponent={
                    isFirstLoad ? (
                        <ActivityIndicator size="small" className="mt-10" />
                    ) : (
                        <Text className="mt-10 text-center text-slate-500">Không tìm thấy câu hỏi nào</Text>
                    )
                }
                ListFooterComponent={isLoading && page > 1 ? <ActivityIndicator size="small" /> : null}
                renderItem={({ item }) => (
                    <QuestionCard
                        question={item}
                        onPress={() =>
                            router.push({
                                pathname: '/(public)/questions/[id]',
                                params: {
                                    id: item.id,
                                },
                            })
                        }
                    />
                )}
            />
        </View>
    )
}

export default SearchResultsPage
