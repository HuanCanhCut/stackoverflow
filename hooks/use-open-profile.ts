import { useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'

// Bấm vào avatar / tên người dùng: của chính mình thì mở trang hồ sơ cá nhân, người khác thì mở hồ sơ công khai
export const useOpenProfile = () => {
    const router = useRouter()
    const currentUserId = useAppSelector(selectCurrentUser)?.id

    return useCallback(
        (userId: number) => {
            if (userId === currentUserId) {
                router.push('/(protected)/profile')
                return
            }

            router.push({ pathname: '/(public)/users/[id]', params: { id: userId } })
        },
        [currentUserId, router],
    )
}
