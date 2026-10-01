import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Image } from 'react-native'

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png')

type AvatarProps = {
    uri?: string | null
    size?: number
    className?: string
}

// Dùng ảnh mặc định khi user chưa có avatar hoặc ảnh tải lỗi
const Avatar = ({ uri, size = 28, className }: AvatarProps) => {
    const [failedUri, setFailedUri] = useState<string | null>(null)

    const hasAvatar = !!uri && uri !== failedUri

    return (
        <Image
            source={hasAvatar ? { uri } : DEFAULT_AVATAR}
            onError={() => setFailedUri(uri ?? null)}
            style={{ width: size, height: size }}
            className={cn('border border-border rounded-full', className)}
        />
    )
}

export default Avatar
