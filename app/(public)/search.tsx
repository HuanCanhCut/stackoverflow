import Header from '@/components/header'
import MarkdownRenderer from '@/components/markdown-renderer'
import { useDebounce } from '@/hooks/use-debounce'
import { getQuestions } from '@/services/questionServices'
import { QuestionModel } from '@/types/model/question.type'
import handleApiError from '@/utils/handleApiError'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

const SearchPage = () => {
    const router = useRouter()

    const [query, setQuery] = useState('')
    const [questions, setQuestions] = useState<QuestionModel[]>([])
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

                const res = await getQuestions({ search: debouncedQuery })

                if (!ignore) {
                    setQuestions(res.data)
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

    const showLoading = isLoading && !!debouncedQuery

    const renderEmpty = () => {
        if (showLoading) {
            return null
        }

        return (
            <Text className="mt-10 text-center text-gray-500">
                {debouncedQuery ? 'Không tìm thấy câu hỏi nào' : 'Nhập từ khoá để tìm kiếm câu hỏi'}
            </Text>
        )
    }

    return (
        <View className="flex-1 bg-white">
            <Header variant="search" searchValue={query} onSearchChange={setQuery} />

            {showLoading && (
                <View className="py-3">
                    <ActivityIndicator size="small" />
                </View>
            )}

            <FlatList
                data={debouncedQuery ? questions : []}
                keyExtractor={(item) => item.id.toString()}
                // Khi bàn phím đang mở, chạm vào item sẽ chạy onPress ngay
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={renderEmpty}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: '/(public)/questions/[id]',
                                params: {
                                    id: item.id,
                                },
                            })
                        }
                        className="gap-2 border-b border-gray-100 px-4 py-3 active:bg-gray-50"
                    >
                        <Text className="text-base font-semibold text-black" numberOfLines={2}>
                            {item.title}
                        </Text>

                        {/* Giới hạn chiều cao để body dài / nhiều code không làm item quá cao,
                            pointerEvents: none để bấm vào vùng body vẫn mở post detail */}
                        <View className="max-h-40 overflow-hidden" style={{ pointerEvents: 'none' }}>
                            <MarkdownRenderer>{item.body}</MarkdownRenderer>
                        </View>

                        {item.tags.length > 0 && (
                            <View className="flex-row flex-wrap gap-2">
                                {item.tags.map(({ tag }) => (
                                    <View key={tag.id} className="rounded-full bg-gray-100 px-2.5 py-1">
                                        <Text className="text-xs text-gray-700">{tag.name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Pressable>
                )}
            />
        </View>
    )
}

export default SearchPage
