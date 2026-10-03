import Avatar from '@/components/avatar'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { NotificationModel } from '@/types/model/notification.type'
import formatRelativeTime from '@/utils/formatRelativeTime'
import { Bell, CheckCircle2, ShieldAlert, ThumbsUp } from 'lucide-react-native'
import { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

// Cấu hình hiển thị theo loại thông báo:
// - useAvatar: dùng ảnh người tạo (actor) thay vì icon (các loại "ai đó đã làm gì")
// - còn lại dùng icon tròn có màu cho các loại hệ thống/tổng hợp
type TypeConfig = {
    useAvatar: boolean
    Icon: LucideIcon
    iconColor: string
    iconBg: string
}

const DEFAULT_CONFIG: TypeConfig = {
    useAvatar: true,
    Icon: Bell,
    iconColor: '#64748b',
    iconBg: '#f1f5f9',
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
    // Có người trả lời / bình luận -> hiển thị avatar của họ
    answer: { ...DEFAULT_CONFIG, useAvatar: true },
    comment: { ...DEFAULT_CONFIG, useAvatar: true },
    // Nhận lượt bình chọn -> icon like màu tím
    vote: { useAvatar: false, Icon: ThumbsUp, iconColor: '#7c3aed', iconBg: '#ede9fe' },
    // Câu trả lời được chấp nhận -> icon tích xanh lá
    accepted: { useAvatar: false, Icon: CheckCircle2, iconColor: '#16a34a', iconBg: '#dcfce7' },
    // Nội dung bị ẩn do kiểm duyệt -> icon cảnh báo đỏ
    question_rejected: { useAvatar: false, Icon: ShieldAlert, iconColor: '#dc2626', iconBg: '#fee2e2' },
}

const getTypeConfig = (type?: string): TypeConfig =>
    (type && TYPE_CONFIG[type]) || DEFAULT_CONFIG

type NotificationItemProps = {
    notification: NotificationModel
    onPress: () => void
    onLongPress: () => void
}

const NotificationItem = ({ notification, onPress, onLongPress }: NotificationItemProps) => {
    const { content, actor, metadata, created_at, recipient } = notification
    // Chưa đọc -> tô nền nhạt và hiện chấm xanh bên phải
    const isUnread = !recipient.is_read
    const config = getTypeConfig(metadata?.type)

    // Nội dung thường có dạng "<Tên> đã ...": tách tên ở đầu để in đậm
    const actorName = actor?.full_name ?? ''
    const startsWithActorName = actorName.length > 0 && content.startsWith(actorName)

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            className={cn(
                'flex-row items-start gap-3 rounded-xl border p-4',
                isUnread ? 'border-blue-100 bg-blue-50/60' : 'border-border bg-white',
            )}
        >
            {config.useAvatar ? (
                <Avatar uri={actor?.avatar_path} size={44} />
            ) : (
                <View
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.iconBg }}
                >
                    <config.Icon size={22} color={config.iconColor} />
                </View>
            )}

            <View className="flex-1 gap-1">
                <Text className="text-sm leading-5 text-foreground">
                    {startsWithActorName ? (
                        <>
                            <Text className="text-sm font-semibold text-foreground">{actorName}</Text>
                            {content.slice(actorName.length)}
                        </>
                    ) : (
                        content
                    )}
                </Text>
                <Text className="text-xs text-muted-foreground">{formatRelativeTime(created_at)}</Text>
            </View>

            {isUnread ? <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
        </Pressable>
    )
}

export default NotificationItem
