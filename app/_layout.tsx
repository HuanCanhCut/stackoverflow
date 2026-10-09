import { Stack, useSegments } from 'expo-router'
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import 'react-native-reanimated'
import '../global.css'
import { PortalHost } from '@rn-primitives/portal'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { persistor, store } from '@/redux/store'
import { useAppDispatch, useAppSelector } from '@/redux/redux.type'
import { selectCurrentUser } from '@/redux/selector'
import { Toaster } from 'sonner-native'
import { useEffect } from 'react'
import { getCurrentUser } from '@/redux/reducers/authSlice'
import { fetchUnseenNotificationCount } from '@/redux/reducers/notificationSlice'
import BottomNavigation from '@/components/bottom-navigation'
import SocketListener from '@/components/socket-listener'

export const unstable_settings = {
    initialRouteName: '(protected)/ask',
}

function RootNavigator() {
    const currentUser = useAppSelector(selectCurrentUser)
    const segments = useSegments()
    const [rootSegment] = segments
    // Màn chat cần toàn bộ chiều cao cho danh sách tin nhắn và ô nhập khi bàn phím mở
    const isChatScreen = segments[1] === 'conversations' && segments[2] === '[id]'

    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getCurrentUser())
    }, [dispatch])

    // Lấy số thông báo chưa nhìn để hiển thị badge trên chuông sau khi đã đăng nhập
    useEffect(() => {
        if (currentUser) {
            dispatch(fetchUnseenNotificationCount())
        }
    }, [currentUser, dispatch])

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="(public)" />

                <Stack.Protected guard={!currentUser}>
                    <Stack.Screen name="(auth)" />
                </Stack.Protected>

                <Stack.Screen name="(protected)" />
            </Stack>

            {rootSegment !== '(auth)' && !isChatScreen && <BottomNavigation />}

            <SocketListener />
        </SafeAreaView>
    )
}

export default function RootLayout() {
    const colorScheme = useColorScheme()

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {/* App đã bật edge-to-edge (SafeAreaView bên dưới tự lo inset). Khai báo rõ để KeyboardProvider
                không tự chèn thêm padding cho status bar / navigation bar, gây header dày gấp đôi */}
            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                            <RootNavigator />
                            <Toaster richColors={true} theme="light" duration={2000} position="top-center" />
                            <StatusBar style="auto" />
                            <PortalHost />
                        </ThemeProvider>
                    </PersistGate>
                </Provider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    )
}
