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

const registerSchema = z
    .object({
        full_name: z
            .string()
            .trim()
            .min(1, 'Họ và tên không được để trống')
            .refine((val) => val.trim().split(/\s+/).filter(Boolean).length >= 2, 'Họ và tên phải có ít nhất 2 từ'),
        email: z.string().email('Email không hợp lệ'),
        password: z.string().min(6, 'Ít nhất 6 ký tự'),
        confirm_password: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Mật khẩu nhập lại không khớp',
        path: ['confirm_password'],
    })

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
    const dispatch = useAppDispatch()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            confirm_password: '',
        },
    })

    const onSubmit = async (data: RegisterFormData) => {
        setErrorMessage('')
        try {
            const res = await authServices.register({
                full_name: data.full_name,
                email: data.email,
                password: data.password,
            })

            if (res && res.meta) {
                const { access_token, refresh_token } = res.meta

                await secureStorage.setItemAsync('access_token', access_token)
                await secureStorage.setItemAsync('refresh_token', refresh_token)
            }

            dispatch(setCurrentUser(res.data))

            toast.success('Đăng ký tài khoản thành công')

            // Không cần navigate vì stack.protected sẽ tự handle về home khi currentUser thay đổi
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
                            <Text className="text-2xl font-bold">Đăng ký</Text>
                            <Text className="text-muted-foreground">Tạo tài khoản để tham gia cộng đồng AskHub</Text>
                        </View>
                        <View className="p-[30px] bg-white rounded-[20px] w-full mt-5 border border-[#a1a1a170]">
                            <View className="gap-1.5">
                                <Text className="font-medium text-sm">Họ và tên</Text>
                                <Controller
                                    control={control}
                                    name="full_name"
                                    render={({ field: { value, onChange, onBlur } }) => (
                                        <Input
                                            className="border-[#a1a1a170] rounded-[10px] px-2.5 h-[45px] text-sm"
                                            autoCapitalize="words" // Tự động viết hoa cho chữ cái đầu tiên của mỗi từ
                                            placeholder="Nhập họ và tên của bạn"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                    )}
                                />
                                {errors.full_name && (
                                    <Text className="text-destructive text-sm mt-1">{errors.full_name.message}</Text>
                                )}
                            </View>

                            <View className="gap-1.5 mt-5">
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

                            <View className="gap-1.5 mt-5">
                                <Text className="font-medium text-sm">Nhập lại mật khẩu</Text>
                                <View className="relative justify-center">
                                    <Controller
                                        control={control}
                                        name="confirm_password"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <Input
                                                className="border-[#a1a1a170] rounded-[10px] pl-2.5 pr-11 h-[45px] text-sm"
                                                secureTextEntry={!showConfirmPassword}
                                                placeholder="Nhập lại mật khẩu của bạn"
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
                                {errors.confirm_password && (
                                    <Text className="text-destructive text-sm mt-1">
                                        {errors.confirm_password.message}
                                    </Text>
                                )}
                            </View>

                            {errorMessage && <Text className="text-destructive text-sm mt-3">{errorMessage}</Text>}

                            <Button
                                className="mt-8 h-[45px] rounded-[10px] bg-black active:bg-black/90"
                                disabled={isSubmitting}
                                onPress={handleSubmit(onSubmit)}
                            >
                                {isSubmitting ? <Spinner /> : <Text className="text-white font-medium">Đăng ký</Text>}
                            </Button>

                            <Text className="text-center mt-5 text-muted-foreground text-sm">
                                Bạn đã có tài khoản?{' '}
                                <Link href={'/login'} className="font-medium" asChild>
                                    <Text className="text-[#0969da] text-sm">Đăng nhập</Text>
                                </Link>
                            </Text>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default RegisterPage
