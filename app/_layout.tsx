import { Stack } from 'expo-router'
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
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

export const unstable_settings = {
    initialRouteName: '/',
}

function RootNavigator() {
    const currentUser = useAppSelector(selectCurrentUser)

    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getCurrentUser())
    }, [dispatch])

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

                <Stack.Protected guard={!!currentUser}>
                    <Stack.Screen name="(protected)" />
                </Stack.Protected>
            </Stack>
        </SafeAreaView>
    )
}

export default function RootLayout() {
    const colorScheme = useColorScheme()

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
        </GestureHandlerRootView>
    )
}
