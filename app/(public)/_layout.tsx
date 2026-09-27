import Header from '@/components/header'
import { Stack } from 'expo-router'

export default function PublicLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                header: () => <Header />,
            }}
        >
            <Stack.Screen name="search" options={{ headerShown: false }} />
        </Stack>
    )
}
