import { Button } from '@/components/ui/button'
import { setCurrentUser } from '@/redux/reducers/authSlice'
import { useAppDispatch } from '@/redux/redux.type'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'

const HomePage = () => {
    const router = useRouter()

    const dispatch = useAppDispatch()

    return (
        <View className="flex-1 justify-center items-center gap-5">
            <Button
                onPress={() => {
                    dispatch(setCurrentUser(null))

                    router.push('/(auth)/login')
                }}
                className="w-fit"
                variant={'destructive'}
            >
                <Text className="text-white">Đăng xuất</Text>
            </Button>
        </View>
    )
}

export default HomePage
