import AttachmentPicker, { AttachmentItem } from '@/components/attachment-picker'
import MarkdownEditor from '@/components/markdown-editor'
import TagInput from '@/components/tag-input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createQuestion } from '@/services/questionServices'
import handleApiError from '@/utils/handleApiError'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { toast } from 'sonner-native'
import { z } from 'zod'

const askSchema = z.object({
    title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
    content: z.string().trim().min(1, 'Chi tiết câu hỏi không được để trống'),
    tags: z.array(z.string()).max(5, 'Chỉ được thêm tối đa 5 chủ đề'),
})

type AskFormData = z.infer<typeof askSchema>

const AskPage = () => {
    const router = useRouter()
    const [attachments, setAttachments] = useState<AttachmentItem[]>([])

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AskFormData>({
        resolver: zodResolver(askSchema),
        defaultValues: {
            title: '',
            content: '',
            tags: [],
        },
    })

    const isUploadingAttachments = attachments.some((item) => item.uploading)

    const onSubmit = async (data: AskFormData) => {
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
        <SafeAreaView className="flex-1">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerClassName="flex-grow py-5 px-5 gap-[15px]"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text className="text-2xl font-bold">Đặt câu hỏi</Text>
                        <View className="gap-2">
                            <Text className="text-base">Tiêu đề câu hỏi</Text>
                            <Controller
                                control={control}
                                name="title"
                                render={({ field: { value, onChange, onBlur } }) => (
                                    <TextInput
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Câu hỏi của bạn là gì?"
                                        className="border border-gray-300 rounded-md p-3 py-3.5"
                                        autoFocus={true}
                                    />
                                )}
                            />
                            {errors.title ? (
                                <Text className="text-destructive text-xs">{errors.title.message}</Text>
                            ) : (
                                <Text className="text-xs">
                                    Hãy cụ thể và tưởng tượng bạn đang đặt câu hỏi cho một người khác.
                                </Text>
                            )}
                        </View>
                        <View className="gap-2">
                            <Text className="text-base">Chi tiết</Text>
                            <Controller
                                control={control}
                                name="content"
                                render={({ field: { value, onChange } }) => (
                                    <MarkdownEditor markdown={value} onChange={onChange} />
                                )}
                            />
                            {errors.content && (
                                <Text className="text-destructive text-xs">{errors.content.message}</Text>
                            )}
                        </View>
                        <View className="gap-2">
                            <Text className="text-base">Chủ đề</Text>
                            <Controller
                                control={control}
                                name="tags"
                                render={({ field: { value, onChange } }) => (
                                    <TagInput tags={value} onChange={onChange} />
                                )}
                            />
                            {errors.tags ? (
                                <Text className="text-destructive text-xs">{errors.tags.message}</Text>
                            ) : (
                                <Text className="text-xs">
                                    Thêm tối đa 5 chủ đề để mô tả câu hỏi của bạn là về vấn đề gì.
                                </Text>
                            )}
                        </View>
                        <View className="gap-2">
                            <Text className="text-base">Đính kèm ảnh</Text>
                            <AttachmentPicker attachments={attachments} onChange={setAttachments} />
                            <Text className="text-xs">Tối đa 10 ảnh, mỗi ảnh không quá 5MB.</Text>
                        </View>
                        <Button
                            className="h-[45px] rounded-[10px] bg-black active:bg-black/90"
                            disabled={isSubmitting || isUploadingAttachments}
                            onPress={handleSubmit(onSubmit)}
                        >
                            {isSubmitting ? <Spinner /> : <Text className="text-white font-medium">Đăng câu hỏi</Text>}
                        </Button>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default AskPage
