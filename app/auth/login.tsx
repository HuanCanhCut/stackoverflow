import { GithubIcon, GoogleIcon } from '@/components/icons/Icons'
import { Link } from 'expo-router'
import { Eye, EyeOff, MessageSquareQuote } from 'lucide-react-native'
import { useState } from 'react'
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

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false)

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
                                />
                            </View>

                            <View style={{ gap: 6, marginTop: 20 }}>
                                <Text>Mật khẩu</Text>
                                <View style={{ position: 'relative' }}>
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
                                    />
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
                                <Link
                                    href={'/auth/login'}
                                    style={{ marginTop: 10, textAlign: 'right', color: '#0969da' }}
                                >
                                    Quên mật khẩu?
                                </Link>

                                <Pressable
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
