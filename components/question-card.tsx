import Avatar from '@/components/avatar'
import MarkdownRenderer from '@/components/markdown-renderer'
import { useOpenProfile } from '@/hooks/use-open-profile'
import { QuestionModel } from '@/types/model/question.type'
import { ArrowBigUp, MessageSquare } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

type QuestionCardProps = {
    question: QuestionModel
    onPress: () => void
}

const QuestionCard = ({ question, onPress }: QuestionCardProps) => {
    const openProfile = useOpenProfile()

    return (
        <Pressable
            onPress={onPress}
            className="gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:bg-slate-50"
        >
            <Text className="text-base font-semibold text-slate-900" numberOfLines={2}>
                {question.title}
            </Text>

            {/* pointerEvents: none để bấm vào vùng body vẫn mở post detail */}
            <View style={{ pointerEvents: 'none' }}>
                <MarkdownRenderer>{question.body}</MarkdownRenderer>
            </View>

            {question.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                    {question.tags.map(({ tag }) => (
                        <View key={tag.id} className="rounded-full bg-slate-100 px-2.5 py-1">
                            <Text className="text-xs text-slate-700">{tag.name}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View className="flex-row items-center justify-between pt-1">
                <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                        <ArrowBigUp size={16} color="#64748b" />
                        <Text className="text-xs text-slate-500">{question.vote_count}</Text>
                    </View>

                    {question.reply_count !== undefined && (
                        <View className="flex-row items-center gap-1">
                            <MessageSquare size={14} color="#64748b" />
                            <Text className="text-xs text-slate-500">{question.reply_count}</Text>
                        </View>
                    )}
                </View>

                {question.author && (
                    <Pressable
                        onPress={() => openProfile(question.author_id)}
                        hitSlop={8}
                        className="flex-shrink flex-row items-center gap-1.5"
                        accessibilityRole="button"
                        accessibilityLabel={`Xem hồ sơ ${question.author.full_name}`}
                    >
                        <Avatar uri={question.author.avatar_path} size={20} />
                        <Text className="flex-shrink text-xs text-slate-500" numberOfLines={1}>
                            {question.author.full_name}
                        </Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    )
}

export default QuestionCard
