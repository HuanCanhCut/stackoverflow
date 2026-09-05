import { setCurrentUser } from '@/redux/reducers/authSlice'
import { useAppDispatch } from '@/redux/redux.type'
import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

const HomePage = () => {
    const dispatch = useAppDispatch()

    return (
        <View style={{ flex: 1 }}>
            <Pressable
                onPress={() => {
                    dispatch(setCurrentUser(null))
                }}
                style={{ justifyContent: 'center', alignItems: 'center', height: 50 }}
            >
                <Text>Đăng xuất</Text>
            </Pressable>

            <Link href={'/(auth)/login'}>Login</Link>
        </View>
    )
}

export default HomePage
