import { ArrowDown, ArrowUp, Bookmark, CornerDownRight, MessageSquare, Pencil, Reply } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { QuestionModel } from '@/types/model/question.type'
import { Card, CardContent } from '@/components/ui/card'
import MarkdownRenderer from '@/components/markdown-renderer'
import Avatar from '@/components/avatar'
import { cn } from '@/lib/utils'

export const ACTIVE_COLOR = '#f97316'
const INACTIVE_COLOR = '#0f172a'
const MUTED_COLOR = '#64748b'

export type VoteType = 'upvote' | 'downvote'

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type PostItemProps = {
    post: QuestionModel
    isQuestion?: boolean
    onVote: (post: QuestionModel, type: VoteType) => void
    // Chỉ dùng cho câu hỏi
    onToggleSave?: () => void
    /** Chỉ truyền khi người xem là tác giả */
    onEdit?: () => void
    // Chỉ dùng cho comment
    onReply?: (post: QuestionModel) => void
    onToggleReplies?: (post: QuestionModel) => void
    repliesExpanded?: boolean
    /** Tên người được trả lời, hiển thị khi comment lồng quá sâu không còn thụt lề được nữa */
    replyToName?: string
}

const PostItem = ({
    post,
    isQuestion = false,
    onVote,
    onToggleSave,
    onEdit,
    onReply,
    onToggleReplies,
    repliesExpanded = false,
    replyToName,
}: PostItemProps) => {
    const upvoted = post.my_vote === 1
    const downvoted = post.my_vote === -1
    const replyCount = post.reply_count ?? 0

    // Bấm vào comment để xem / ẩn phản hồi; các nút bên trong (vote, trả lời...) vẫn xử lý riêng
    const canToggleReplies = !isQuestion && replyCount > 0

    return (
        <Pressable
            onPress={() => onToggleReplies?.(post)}
            disabled={!canToggleReplies}
            accessibilityState={canToggleReplies ? { expanded: repliesExpanded } : undefined}
        >
            <Card className="w-full px-0!">
                <CardContent className="px-2">
                    <View className="flex-row">
                        <View className="pr-2 items-center">
                            <Pressable
                                className="p-2"
                                onPress={() => onVote(post, 'upvote')}
                                accessibilityRole="button"
                                accessibilityLabel="Upvote"
                                accessibilityState={{ selected: upvoted }}
                            >
                                <ArrowUp
                                    color={upvoted ? ACTIVE_COLOR : INACTIVE_COLOR}
                                    strokeWidth={upvoted ? 3 : 2}
                                />
                            </Pressable>
                            <Text
                                className={cn('font-bold', isQuestion ? 'text-3xl' : 'text-2xl')}
                                style={post.my_vote ? { color: ACTIVE_COLOR } : undefined}
                            >
                                {post.vote_count}
                            </Text>
                            <Pressable
                                className="p-2"
                                onPress={() => onVote(post, 'downvote')}
                                accessibilityRole="button"
                                accessibilityLabel="Downvote"
                                accessibilityState={{ selected: downvoted }}
                            >
                                <ArrowDown
                                    color={downvoted ? ACTIVE_COLOR : INACTIVE_COLOR}
                                    strokeWidth={downvoted ? 3 : 2}
                                />
                            </Pressable>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                                <Avatar uri={post.author?.avatar_path} />
                                <View className="flex-1">
                                    <Text className="font-medium">{post.author?.full_name}</Text>
                                    <Text className="text-xs text-muted-foreground">{formatDate(post.created_at)}</Text>
                                </View>
                            </View>
                            {replyToName && (
                                <View className="mt-2 flex-row items-center gap-1">
                                    <CornerDownRight size={12} color={MUTED_COLOR} />
                                    <Text className="text-xs text-muted-foreground">Trả lời {replyToName}</Text>
                                </View>
                            )}
                            {isQuestion && <Text className="mt-2 font-bold text-3xl">{post.title}</Text>}
                            <MarkdownRenderer>{post.body}</MarkdownRenderer>
                            {post.tags.length > 0 && (
                                <View className="mt-2 flex-row flex-wrap gap-2">
                                    {post.tags.map((tag) => {
                                        return (
                                            <View key={tag.tag_id} className="bg-zinc-50 p-2 rounded-sm w-fit ">
                                                <Text className="text-xs text-muted-foreground">{tag.tag.name}</Text>
                                            </View>
                                        )
                                    })}
                                </View>
                            )}
                            {isQuestion ? (
                                <View className="flex-row gap-3 mt-3">
                                    <View className="flex-row items-center gap-1">
                                        <MessageSquare
                                            size={16}
                                            className="mt-0.75 text-muted-foreground"
                                        ></MessageSquare>
                                        <Text className="mb-1">{replyCount} câu trả lời</Text>
                                    </View>

                                    <Pressable
                                        className="mt-0.5 flex-row items-center gap-1 p-1"
                                        onPress={onToggleSave}
                                        accessibilityRole="button"
                                        accessibilityLabel={post.is_saved ? 'Bỏ lưu' : 'Lưu bài viết'}
                                        accessibilityState={{ selected: !!post.is_saved }}
                                    >
                                        <Bookmark
                                            size={16}
                                            color={post.is_saved ? ACTIVE_COLOR : INACTIVE_COLOR}
                                            fill={post.is_saved ? ACTIVE_COLOR : 'transparent'}
                                        />
                                        <Text className="mb-1">{post.is_saved ? 'Đã lưu' : 'Lưu'}</Text>
                                    </Pressable>

                                    {onEdit && (
                                        <Pressable
                                            className="mt-0.5 flex-row items-center gap-1 p-1"
                                            onPress={onEdit}
                                            accessibilityRole="button"
                                            accessibilityLabel="Chỉnh sửa câu hỏi"
                                        >
                                            <Pencil size={16} color={INACTIVE_COLOR} />
                                            <Text className="mb-1">Chỉnh sửa</Text>
                                        </Pressable>
                                    )}
                                </View>
                            ) : (
                                <View className="flex-row gap-3 mt-2">
                                    <Pressable
                                        className="flex-row items-center gap-1 p-1"
                                        onPress={() => onReply?.(post)}
                                        accessibilityRole="button"
                                        accessibilityLabel="Trả lời"
                                    >
                                        <Reply size={16} color={MUTED_COLOR} />
                                        <Text className="text-sm text-muted-foreground">Trả lời</Text>
                                    </Pressable>

                                    {replyCount > 0 && (
                                        <Pressable
                                            className="flex-row items-center gap-1 p-1"
                                            onPress={() => onToggleReplies?.(post)}
                                            accessibilityRole="button"
                                            accessibilityState={{ expanded: repliesExpanded }}
                                        >
                                            <MessageSquare size={16} color={MUTED_COLOR} />
                                            <Text className="text-sm text-muted-foreground">
                                                {repliesExpanded ? 'Ẩn phản hồi' : `Xem ${replyCount} phản hồi`}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </CardContent>
            </Card>
        </Pressable>
    )
}

export default PostItem
