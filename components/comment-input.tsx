import { cn } from '@/lib/utils'
import { Maximize2, SendHorizontal, X } from 'lucide-react-native'
import { Ref, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spinner } from '@/components/ui/spinner'
import MarkdownEditor from '@/components/markdown-editor'

type CommentInputProps = {
    /** false: chỉ hiển thị giao diện, bấm vào sẽ gọi onRequireLogin */
    canComment: boolean
    onRequireLogin: () => void
    /** Trả về true nếu gửi thành công để xoá nội dung đã nhập */
    onSubmit: (body: string) => Promise<boolean>
    /** Tên người đang được trả lời, null = trả lời câu hỏi */
    replyingTo?: string | null
    onCancelReply?: () => void
    inputRef?: Ref<TextInput>
}

const CommentInput = ({
    canComment,
    onRequireLogin,
    onSubmit,
    replyingTo,
    onCancelReply,
    inputRef,
}: CommentInputProps) => {
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)
    // Mở trình soạn markdown đầy đủ (toolbar, xem trước) khi cần định dạng
    const [editorVisible, setEditorVisible] = useState(false)
    const insets = useSafeAreaInsets()

    const canSubmit = body.trim().length > 0 && !submitting
    const placeholder = replyingTo ? `Trả lời ${replyingTo}...` : 'Viết câu trả lời...'

    const handleSubmit = async () => {
        if (!canSubmit) return

        setSubmitting(true)
        const success = await onSubmit(body.trim())
        setSubmitting(false)

        if (success) {
            setBody('')
            setEditorVisible(false)
        }
    }

    const handleOpenEditor = () => {
        if (!canComment) {
            onRequireLogin()
            return
        }

        setEditorVisible(true)
    }

    const sendButton = (
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
    )

    return (
        <View className="border-t border-[#e2e8f0] bg-white">
            {!!replyingTo && (
                <View className="flex-row items-center justify-between px-3 pt-2">
                    <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                        Đang trả lời <Text className="font-semibold text-foreground">{replyingTo}</Text>
                    </Text>
                    <Pressable
                        onPress={onCancelReply}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Huỷ trả lời"
                    >
                        <X size={16} color="#64748b" />
                    </Pressable>
                </View>
            )}

            <View className="flex-row items-end gap-2 px-2 py-2">
                {canComment ? (
                    <TextInput
                        ref={inputRef}
                        value={body}
                        onChangeText={setBody}
                        placeholder={placeholder}
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
                        <Text className="text-base text-[#94a3b8]">{placeholder}</Text>
                    </Pressable>
                )}

                <Pressable
                    onPress={handleOpenEditor}
                    hitSlop={4}
                    className="h-10 w-8 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Mở trình soạn markdown"
                >
                    <Maximize2 color="#64748b" size={18} />
                </Pressable>

                {sendButton}
            </View>

            <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1 bg-white"
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                >
                    <View className="h-14 flex-row items-center justify-between gap-2 border-b border-[#e2e8f0] px-2">
                        <Pressable
                            onPress={() => setEditorVisible(false)}
                            hitSlop={8}
                            className="p-2"
                            accessibilityRole="button"
                            accessibilityLabel="Thu gọn"
                        >
                            <X color="#0f172a" size={22} />
                        </Pressable>

                        <Text className="flex-1 text-base font-semibold text-black" numberOfLines={1}>
                            {replyingTo ? `Trả lời ${replyingTo}` : 'Viết câu trả lời'}
                        </Text>

                        {sendButton}
                    </View>

                    <View className="flex-1 p-2">
                        {/* Editor giữ state riêng, lấy nội dung đang gõ ở thanh dưới làm giá trị ban đầu mỗi lần mở */}
                        <MarkdownEditor markdown={body} onChange={setBody} className="flex-1" />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

export default CommentInput
