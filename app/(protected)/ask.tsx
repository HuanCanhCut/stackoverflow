import AttachmentPicker, { AttachmentItem } from '@/components/attachment-picker'
import QuestionForm, { QuestionFormData } from '@/components/question-form'
import { createQuestion } from '@/services/questionServices'
import handleApiError from '@/utils/handleApiError'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { toast } from 'sonner-native'

const AskPage = () => {
    const router = useRouter()
    const [attachments, setAttachments] = useState<AttachmentItem[]>([])

    const isUploadingAttachments = attachments.some((item) => item.uploading)

    const onSubmit = async (data: QuestionFormData) => {
        if (isUploadingAttachments) {
            toast.error('Lỗi', { description: 'Vui lòng đợi ảnh đính kèm tải lên xong.' })
            return
        }

        if (attachments.some((item) => item.error)) {
            toast.error('Lỗi', { description: 'Có ảnh đính kèm tải lên thất bại, vui lòng xóa hoặc thử lại.' })
            return
        }

        try {
            await createQuestion({
                title: data.title,
                body: data.content,
                tags: data.tags,
                uploadIds: attachments.filter((item) => item.uploadId).map((item) => item.uploadId!),
            })

            toast.success('Thành công', { description: 'Đăng câu hỏi thành công.' })
            router.replace('/(public)')
        } catch (error) {
            handleApiError(error)
        }
    }

    return (
        <QuestionForm
            heading="Đặt câu hỏi"
            submitLabel="Đăng câu hỏi"
            onSubmit={onSubmit}
            submitDisabled={isUploadingAttachments}
            autoFocusTitle
        >
            <View className="gap-2">
                <Text className="text-base">Đính kèm ảnh</Text>
                <AttachmentPicker attachments={attachments} onChange={setAttachments} />
                <Text className="text-xs">Tối đa 10 ảnh, mỗi ảnh không quá 5MB.</Text>
            </View>
        </QuestionForm>
    )
}

export default AskPage
