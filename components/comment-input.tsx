import { cn } from '@/lib/utils'
import { SendHorizontal } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Spinner } from '@/components/ui/spinner'

type CommentInputProps = {
    /** false: chỉ hiển thị giao diện, bấm vào sẽ gọi onRequireLogin */
    canComment: boolean
    onRequireLogin: () => void
    /** Trả về true nếu gửi thành công để xoá nội dung đã nhập */
    onSubmit: (body: string) => Promise<boolean>
}

const CommentInput = ({ canComment, onRequireLogin, onSubmit }: CommentInputProps) => {
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const canSubmit = body.trim().length > 0 && !submitting

    const handleSubmit = async () => {
        if (!canSubmit) return

        setSubmitting(true)
        const success = await onSubmit(body.trim())
        setSubmitting(false)

        if (success) setBody('')
    }

    return (
        <View className="flex-row items-end gap-2 border-t border-[#e2e8f0] bg-white px-2 py-2">
            {canComment ? (
                <TextInput
                    value={body}
                    onChangeText={setBody}
                    placeholder="Viết câu trả lời..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    editable={!submitting}
                    className="max-h-28 min-h-10 flex-1 rounded-2xl border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-base leading-5 text-foreground"
                />
            ) : (
                <Pressable
                    onPress={onRequireLogin}
                    className="min-h-10 flex-1 justify-center rounded-2xl border border-[#e2e8f0] bg-slate-50 px-3"
                    accessibilityRole="button"
                >
                    <Text className="text-base text-[#94a3b8]">Viết câu trả lời...</Text>
                </Pressable>
            )}

            <Pressable
                onPress={canComment ? handleSubmit : onRequireLogin}
                disabled={canComment && !canSubmit}
                className={cn('h-10 w-10 items-center justify-center rounded-full bg-primary', {
                    'opacity-40': canComment && !canSubmit,
                })}
                accessibilityRole="button"
                accessibilityLabel="Gửi câu trả lời"
            >
                {submitting ? <Spinner color="#ffffff" /> : <SendHorizontal color="#ffffff" size={18} />}
            </Pressable>
        </View>
    )
}

export default CommentInput
