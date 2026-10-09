import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { setCurrentUser } from '@/redux/reducers/authSlice'
import { useAppDispatch } from '@/redux/redux.type'
import * as authServices from '@/services/authServices'
import { getErrMessageFromAPI } from '@/utils/handleApiError'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import * as secureStorage from '@/lib/secure-storage'
import { Eye, EyeOff, MessageSquareQuote } from 'lucide-react-native'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'
import DismissKeyboard from '@/components/dismiss-keyboard'
import { SafeAreaView } from 'react-native-safe-area-context'
import KeyboardAwareScrollView from '@/components/keyboard-aware-scroll-view'
import { toast } from 'sonner-native'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Ít nhất 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
    const dispatch = useAppDispatch()

    const [showPassword, setShowPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        setErrorMessage('')
        try {
            const res = await authServices.login({
                email: data.email,
                password: data.password,
            })

            if (res && res.meta) {
                const { access_token, refresh_token } = res.meta

                await secureStorage.setItemAsync('access_token', access_token)
                await secureStorage.setItemAsync('refresh_token', refresh_token)
            }

            dispatch(setCurrentUser(res.data))

            toast.success('Đăng nhập thành công')

            // Không cần navigate vì stack.protected sẽ tự handle về home
        } catch (error) {
            const err = getErrMessageFromAPI(error)
            setErrorMessage(err)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <DismissKeyboard>
                <KeyboardAwareScrollView
                    bottomOffset={24}
                    contentContainerClassName="flex-grow justify-center py-5 px-5 gap-[15px]"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row items-center justify-start gap-2 w-full">
                        <View className="p-2 bg-[#0969da] rounded-[10px]">
                            <MessageSquareQuote size={24} color="white" />
                        </View>
                        <Text className="text-2xl font-bold">AskHub</Text>
                    </View>
                    <View className="gap-1.5">
                        <Text className="text-2xl font-bold">Đăng nhập</Text>
                        <Text className="text-muted-foreground">Chào mừng bạn quay trở lại với AskHub</Text>
                    </View>
                    <View className="p-[30px] bg-white rounded-[20px] w-full mt-5 border border-[#a1a1a170]">
                        <View className="gap-1.5">
                            <Text className="font-medium text-sm">Email</Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { value, onChange, onBlur } }) => (
                                    <Input
                                        className="border-[#a1a1a170] rounded-[10px] px-2.5 h-[45px] text-sm"
                                        inputMode="email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Nhập email của bạn"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text className="text-destructive text-sm mt-1">{errors.email.message}</Text>
                            )}
                        </View>

                        {/* Password field */}
                        <View className="gap-1.5 mt-5">
                            <Text className="font-medium text-sm">Mật khẩu</Text>
                            <View className="relative justify-center">
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { value, onChange, onBlur } }) => (
                                        <Input
                                            className="border-[#a1a1a170] rounded-[10px] pl-2.5 pr-11 h-[45px] text-sm"
                                            secureTextEntry={!showPassword}
                                            placeholder="Nhập mật khẩu của bạn"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                    )}
                                />

                                <Pressable
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
                                >
                                    {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                                </Pressable>
                            </View>
                        </View>

                        {errors.password && (
                            <Text className="text-destructive text-sm mt-1">{errors.password.message}</Text>
                        )}

                        {!!errorMessage && <Text className="text-destructive text-sm mt-3">{errorMessage}</Text>}

                        <Link href={'/forgot-password'} asChild>
                            <Pressable className="mt-2.5 self-end">
                                <Text className="text-[#0969da] text-sm">Quên mật khẩu?</Text>
                            </Pressable>
                        </Link>

                        <Button
                            className="mt-8 h-[45px] rounded-[10px] bg-black active:bg-black/90"
                            disabled={isSubmitting}
                            onPress={handleSubmit(onSubmit)}
                        >
                            {isSubmitting ? <Spinner /> : <Text className="text-white font-medium">Đăng nhập</Text>}
                        </Button>
                        <Text className="text-center mt-5 text-muted-foreground text-sm">
                            Bạn chưa có tài khoản?{' '}
                            <Link href={'/register'} className="font-medium" asChild>
                                <Text className="text-[#0969da] text-sm">Đăng ký</Text>
                            </Link>
                        </Text>
                    </View>
                </KeyboardAwareScrollView>
            </DismissKeyboard>
        </SafeAreaView>
    )
}

export default LoginPage
