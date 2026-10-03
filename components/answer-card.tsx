import MarkdownRenderer from '@/components/markdown-renderer'
import { QuestionModel } from '@/types/model/question.type'
import { ArrowBigUp, CornerDownRight } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

type AnswerCardProps = {
    answer: QuestionModel
    onPress: () => void
}

// Hiển thị một câu trả lời của chính user, kèm tiêu đề câu hỏi gốc làm ngữ cảnh
const AnswerCard = ({ answer, onPress }: AnswerCardProps) => {
    return (
        <Pressable
            onPress={onPress}
            className="gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:bg-slate-50"
        >
            {/* Ngữ cảnh: trả lời cho câu hỏi nào (tiêu đề = tiêu đề câu hỏi gốc) */}
            <View className="flex-row items-center gap-1">
                <CornerDownRight size={14} color="#64748b" />
                <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
                    Trả lời cho: {answer.title}
                </Text>
            </View>

            {/* Nội dung câu trả lời của mình */}
            <View className="max-h-32 overflow-hidden" style={{ pointerEvents: 'none' }}>
                <MarkdownRenderer>{answer.body}</MarkdownRenderer>
            </View>

            <View className="flex-row items-center gap-1 pt-1">
                <ArrowBigUp size={16} color="#64748b" />
                <Text className="text-xs text-slate-500">{answer.vote_count}</Text>
            </View>
        </Pressable>
    )
}

export default AnswerCard
