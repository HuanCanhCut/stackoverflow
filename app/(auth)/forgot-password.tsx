import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { setCurrentUser } from '@/redux/reducers/authSlice'
import { useAppDispatch } from '@/redux/redux.type'
import * as authServices from '@/services/authServices'
import { getErrMessageFromAPI } from '@/utils/handleApiError'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import * as secureStorage from 'expo-secure-store'
import { Eye, EyeOff, MessageSquareQuote } from 'lucide-react-native'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { toast } from 'sonner-native'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Ít nhất 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

const ForgotPassword = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()

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

            router.push('/')
        } catch (error) {
            console.log(error)
            const err = getErrMessageFromAPI(error)
            setErrorMessage(err)
            toast.error(err)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
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
                            <Text className="text-2xl font-bold">Quên mật khẩu</Text>
                            <Text className="text-muted-foreground">
                                Không vấn đề gì! Nhập email của bạn và chúng tôi sẽ gửi cho bạn mã xác thực để khôi phục
                                mật khẩu
                            </Text>
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

                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Mã xác minh</Text>
                                <View className="flex-row items-center gap-1 w-full">
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="flex-1 border-[#a1a1a170] rounded-[10px] px-2.5 h-[45px] text-sm"
                                                placeholder="Nhập mã xác minh"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                            />
                                        )}
                                    />

                                    <Button className="bg-black active:bg-black/90 h-[45px] rounded-[10px] px-4 shrink-0">
                                        <Text className="text-white font-medium text-sm">Gửi mã</Text>
                                    </Button>
                                </View>
                            </View>

                            {/* Password field */}
                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Mật khẩu mới</Text>
                                <View className="relative justify-center">
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="border-[#a1a1a170] rounded-[10px] pl-2.5 pr-11 h-[45px] text-sm"
                                                secureTextEntry={!showPassword}
                                                placeholder="Nhập mật khẩu mới"
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
                                        {showPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            {errors.password && (
                                <Text className="text-destructive text-sm mt-1">{errors.password.message}</Text>
                            )}

                            {/* Password field */}
                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Xác nhận mật khẩu mới</Text>
                                <View className="relative justify-center">
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="border-[#a1a1a170] rounded-[10px] pl-2.5 pr-11 h-[45px] text-sm"
                                                secureTextEntry={!showPassword}
                                                placeholder="Xác nhận mật khẩu mới"
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
                                        {showPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            {errorMessage && <Text className="text-destructive text-sm mt-3">{errorMessage}</Text>}

                            <Button
                                className="mt-8 h-[45px] rounded-[10px] bg-black active:bg-black/90"
                                disabled={isSubmitting}
                                onPress={handleSubmit(onSubmit)}
                            >
                                {isSubmitting ? (
                                    <Spinner />
                                ) : (
                                    <Text className="text-white font-medium">Đổi mật khẩu</Text>
                                )}
                            </Button>
                        </View>

                        <Text className="text-center mt-5 text-muted-foreground">
                            Bạn chưa có tài khoản?{' '}
                            <Link href={'/register'} asChild>
                                <Text className="text-[#0969da] font-medium">Đăng ký</Text>
                            </Link>
                        </Text>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default ForgotPassword
