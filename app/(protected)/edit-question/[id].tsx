import QuestionForm, { QuestionFormData } from '@/components/question-form'
import { Spinner } from '@/components/ui/spinner'
import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import * as questionServices from '@/services/questionServices'
import { QuestionModel } from '@/types/model/question.type'
import handleApiError from '@/utils/handleApiError'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { toast } from 'sonner-native'

const EditQuestionPage = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const questionId = Number(id)
    const router = useRouter()
    const currentUser = useAppSelector(selectCurrentUser)

    const [question, setQuestion] = useState<QuestionModel>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getQuestion = async () => {
            try {
                const { data } = await questionServices.getQuestion(questionId)

                setQuestion(data)
            } catch (error) {
                handleApiError(error)
            } finally {
                setLoading(false)
            }
        }

        getQuestion()
    }, [questionId])

    const onSubmit = async (data: QuestionFormData) => {
        try {
            await questionServices.updateQuestion({
                id: questionId,
                title: data.title,
                body: data.content,
                tags: data.tags,
            })

            toast.success('Thành công', { description: 'Đã cập nhật câu hỏi.' })
            // Trang chi tiết tự tải lại câu hỏi khi được focus lại
            router.back()
        } catch (error) {
            handleApiError(error)
        }
    }

    if (loading) {
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

    if (question.author_id !== currentUser?.id) {
        return (
            <View className="flex-1 items-center justify-center px-6">
                <Text className="text-center text-muted-foreground">Bạn chỉ có thể chỉnh sửa câu hỏi của mình</Text>
            </View>
        )
    }

    return (
        <QuestionForm
            heading="Chỉnh sửa câu hỏi"
            submitLabel="Lưu thay đổi"
            defaultValues={{
                title: question.title,
                content: question.body,
                tags: question.tags.map(({ tag }) => tag.name),
            }}
            onSubmit={onSubmit}
        />
    )
}

export default EditQuestionPage
