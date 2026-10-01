import MarkdownEditor from '@/components/markdown-editor'
import TagInput from '@/components/tag-input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { zodResolver } from '@hookform/resolvers/zod'
import { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import KeyboardAwareScrollView from '@/components/keyboard-aware-scroll-view'
import { z } from 'zod'

const questionSchema = z.object({
    title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
    content: z.string().trim().min(1, 'Chi tiết câu hỏi không được để trống'),
    tags: z.array(z.string()).max(5, 'Chỉ được thêm tối đa 5 chủ đề'),
})

export type QuestionFormData = z.infer<typeof questionSchema>

type QuestionFormProps = {
    heading: string
    submitLabel: string
    /** MarkdownEditor chỉ đọc giá trị ban đầu khi mount, nên phải có đủ dữ liệu trước khi render form */
    defaultValues?: QuestionFormData
    onSubmit: (data: QuestionFormData) => Promise<void>
    submitDisabled?: boolean
    autoFocusTitle?: boolean
    /** Phần thêm hiển thị trước nút submit (vd. đính kèm ảnh khi tạo câu hỏi) */
    children?: ReactNode
}

const QuestionForm = ({
    heading,
    submitLabel,
    defaultValues = { title: '', content: '', tags: [] },
    onSubmit,
    submitDisabled = false,
    autoFocusTitle = false,
    children,
}: QuestionFormProps) => {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<QuestionFormData>({
        resolver: zodResolver(questionSchema),
        defaultValues,
    })

    return (
        <SafeAreaView className="flex-1">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAwareScrollView
                    bottomOffset={24}
                    contentContainerClassName="flex-grow py-5 px-5 gap-[15px]"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text className="text-2xl font-bold">{heading}</Text>
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
                                    autoFocus={autoFocusTitle}
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
                        {errors.content && <Text className="text-destructive text-xs">{errors.content.message}</Text>}
                    </View>
                    <View className="gap-2">
                        <Text className="text-base">Chủ đề</Text>
                        <Controller
                            control={control}
                            name="tags"
                            render={({ field: { value, onChange } }) => <TagInput tags={value} onChange={onChange} />}
                        />
                        {errors.tags ? (
                            <Text className="text-destructive text-xs">{errors.tags.message}</Text>
                        ) : (
                            <Text className="text-xs">
                                Thêm tối đa 5 chủ đề để mô tả câu hỏi của bạn là về vấn đề gì.
                            </Text>
                        )}
                    </View>
                    {children}
                    <Button
                        className="h-[45px] rounded-[10px] bg-black active:bg-black/90"
                        disabled={isSubmitting || submitDisabled}
                        onPress={handleSubmit(onSubmit)}
                    >
                        {isSubmitting ? <Spinner /> : <Text className="text-white font-medium">{submitLabel}</Text>}
                    </Button>
                </KeyboardAwareScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}

export default QuestionForm
