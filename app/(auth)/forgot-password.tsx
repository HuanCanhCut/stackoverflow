import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import * as authServices from '@/services/authServices'
import { getErrMessageFromAPI } from '@/utils/handleApiError'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import { Eye, EyeOff, MessageSquareQuote } from 'lucide-react-native'
import { useEffect, useState } from 'react'
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

const forgotPasswordSchema = z
    .object({
        email: z.string().email('Email không đúng định dạng'),
        code: z
            .string()
            .min(1, 'Vui lòng nhập mã xác minh')
            .regex(/^\d{6}$/, 'Mã xác minh phải có đúng 6 chữ số'),
        password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
        confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
    })

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
    const router = useRouter()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [countdown, setCountdown] = useState(0)
    const [isSendingCode, setIsSendingCode] = useState(false)

    useEffect(() => {
        if (countdown <= 0) return

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [countdown])

    const {
        control,
        handleSubmit,
        trigger,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
            code: '',
            password: '',
            confirmPassword: '',
        },
    })

    const handleSendCode = async () => {
        const email = getValues('email')
        if (!email) {
            toast.error('Vui lòng nhập email trước khi gửi mã')
            return
        }

        const isEmailValid = await trigger('email')
        if (!isEmailValid) return

        try {
            setIsSendingCode(true)
            await authServices.sendForgotPasswordCode({ email })
            toast.success('Mã xác thực đã được gửi đến email của bạn')
            setCountdown(60)
        } catch (error) {
            const err = getErrMessageFromAPI(error)
            toast.error(err)
        } finally {
            setIsSendingCode(false)
        }
    }

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setErrorMessage('')
        try {
            await authServices.resetPassword({
                email: data.email,
                password: data.password,
                code: Number(data.code),
            })

            toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập.')
            router.replace('/login')
        } catch (error) {
            const err = getErrMessageFromAPI(error)
            setErrorMessage(err)
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
                            {/* Email field */}
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

                            {/* Verification Code field */}
                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Mã xác minh</Text>
                                <View className="flex-row items-center gap-1 w-full">
                                    <Controller
                                        control={control}
                                        name="code"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="flex-1 border-[#a1a1a170] rounded-[10px] px-2.5 h-[45px] text-sm"
                                                placeholder="Nhập mã xác minh 6 số"
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                            />
                                        )}
                                    />

                                    <Button
                                        className="bg-black active:bg-black/90 h-[45px] rounded-[10px] px-4 shrink-0"
                                        disabled={countdown > 0 || isSendingCode}
                                        onPress={handleSendCode}
                                    >
                                        {isSendingCode ? (
                                            <Spinner />
                                        ) : (
                                            <Text className="text-white font-medium text-sm">
                                                {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi mã'}
                                            </Text>
                                        )}
                                    </Button>
                                </View>
                                {errors.code && (
                                    <Text className="text-destructive text-sm mt-1">{errors.code.message}</Text>
                                )}
                            </View>

                            {/* New Password field */}
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
                                {errors.password && (
                                    <Text className="text-destructive text-sm mt-1">{errors.password.message}</Text>
                                )}
                            </View>

                            {/* Confirm Password field */}
                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Xác nhận mật khẩu mới</Text>
                                <View className="relative justify-center">
                                    <Controller
                                        control={control}
                                        name="confirmPassword"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="border-[#a1a1a170] rounded-[10px] pl-2.5 pr-11 h-[45px] text-sm"
                                                secureTextEntry={!showConfirmPassword}
                                                placeholder="Xác nhận mật khẩu mới"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                            />
                                        )}
                                    />

                                    <Pressable
                                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </Pressable>
                                </View>
                                {errors.confirmPassword && (
                                    <Text className="text-destructive text-sm mt-1">
                                        {errors.confirmPassword.message}
                                    </Text>
                                )}
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

                        <View className="items-center gap-2 mt-5">
                            <Text className="text-center text-muted-foreground">
                                Bạn chưa có tài khoản?{' '}
                                <Link href={'/register'} asChild>
                                    <Text className="text-[#0969da] font-medium">Đăng ký</Text>
                                </Link>
                            </Text>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default ForgotPassword
