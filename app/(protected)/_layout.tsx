import { selectCurrentUser } from '@/redux/selector'
import { useAppSelector } from '@/redux/redux.type'
import { Redirect, Stack } from 'expo-router'

export default function ProtectedLayout() {
    const currentUser = useAppSelector(selectCurrentUser)

    if (!currentUser) {
        return <Redirect href="/(auth)/login" />
    }

    return <Stack screenOptions={{ headerShown: false }} />
}
