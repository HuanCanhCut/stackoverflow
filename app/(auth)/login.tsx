import { GithubIcon, GoogleIcon } from '@/components/icons/Icons'
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
    Text,
    TextInput,
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

const LoginPage = () => {
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
            console.log('calling api')

            const res = await authServices.login({
                email: data.email,
                password: data.password,
            })

            console.log('called api')

            if (res && res.meta) {
                const { access_token, refresh_token } = res.meta

                secureStorage.setItemAsync('access_token', access_token)
                secureStorage.setItemAsync('refresh_token', refresh_token)
            }

            dispatch(setCurrentUser(res.data))

            toast.success('Đăng nhập thành công')

            router.push('/')
        } catch (error) {
            console.log(error)

            setErrorMessage(getErrMessageFromAPI(error))
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'center',
                            paddingVertical: 20,
                            gap: 15,
                            paddingHorizontal: 20,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                            }}
                        >
                            <View style={{ padding: 8, backgroundColor: '#0969da', borderRadius: 10 }}>
                                <MessageSquareQuote size={24} color={'white'} />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>AskHub</Text>
                        </View>

                        <View style={{ gap: 6 }}>
                            <Text style={{ fontWeight: '700', fontSize: 24 }}>Đăng nhập</Text>
                            <Text>Chào mừng bạn quay trở lại với AskHub</Text>
                        </View>

                        <View
                            style={{
                                padding: 30,
                                backgroundColor: 'white',
                                borderRadius: 20,
                                height: 'auto',
                                width: '100%',
                                marginTop: 20,
                                borderWidth: 1,
                                borderColor: '#a1a1a170',
                            }}
                        >
                            <View style={{ gap: 6 }}>
                                <Text>Email</Text>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { value, onChange, onBlur } }) => (
                                        <TextInput
                                            style={{
                                                borderColor: '#a1a1a170',
                                                borderWidth: 1,
                                                borderRadius: 10,
                                                paddingHorizontal: 10,
                                                height: 45,
                                            }}
                                            inputMode="text"
                                            placeholder="Nhập email của bạn"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                    )}
                                />

                                {errors.email && <Text style={{ color: 'red' }}>{errors.email.message}</Text>}
                            </View>

                            <View style={{ gap: 6, marginTop: 20 }}>
                                <Text>Mật khẩu</Text>
                                <View style={{ position: 'relative' }}>
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <TextInput
                                                style={{
                                                    borderColor: '#a1a1a170',
                                                    borderWidth: 1,
                                                    borderRadius: 10,
                                                    paddingHorizontal: 10,
                                                    paddingRight: 40,
                                                    height: 45,
                                                }}
                                                secureTextEntry={!showPassword}
                                                placeholder="Nhập mật khẩu của bạn"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                            />
                                        )}
                                    />

                                    {errors.password && (
                                        <Text style={{ color: 'red', marginTop: 6 }}>{errors.password.message}</Text>
                                    )}

                                    <Pressable
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        style={{
                                            position: 'absolute',
                                            right: 4,
                                            top: '50%',
                                            transform: [{ translateY: '-50%' }],
                                            padding: 10,
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </Pressable>
                                </View>

                                {errorMessage && <Text style={{ color: 'red' }}>{errorMessage}</Text>}

                                <Link href={'/login'} style={{ marginTop: 10, textAlign: 'right', color: '#0969da' }}>
                                    Quên mật khẩu?
                                </Link>

                                <Pressable
                                    disabled={isSubmitting}
                                    style={({ pressed }) => {
                                        return [
                                            {
                                                backgroundColor: '#000',
                                                borderRadius: 10,
                                                height: 45,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: 20,
                                                opacity: pressed ? 0.9 : 1,
                                            },
                                        ]
                                    }}
                                    onPress={handleSubmit(onSubmit)}
                                >
                                    <Text style={{ color: 'white' }}>Đăng nhập</Text>
                                </Pressable>
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginTop: 20,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        height: 1,
                                        backgroundColor: '#a1a1a170',
                                    }}
                                />
                                <Text>Hoặc tiếp tục với</Text>
                                <View
                                    style={{
                                        flex: 1,
                                        height: 1,
                                        backgroundColor: '#a1a1a170',
                                    }}
                                />
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 20,
                                    marginTop: 20,
                                }}
                            >
                                <Pressable
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 10,
                                        height: 45,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: '#a1a1a170',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <GoogleIcon />
                                        <Text style={{ color: 'black' }}>Google</Text>
                                    </View>
                                </Pressable>

                                <Pressable
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 10,
                                        height: 45,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: '#a1a1a170',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <GithubIcon />
                                        <Text style={{ color: 'black' }}>Github</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        <Text style={{ textAlign: 'center', marginTop: 20 }}>
                            Bạn chưa có tài khoản? <Text style={{ color: '#0969da' }}>Đăng ký</Text>
                        </Text>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default LoginPage
