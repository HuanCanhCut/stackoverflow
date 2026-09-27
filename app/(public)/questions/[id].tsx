import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

const PostDetailPage = () => {
    const { id } = useLocalSearchParams<{ id: string }>()

    return (
        <View className="flex-1 justify-center items-center">
            <Text className="text-xl font-bold">Post detail #{id}</Text>
        </View>
    )
}

export default PostDetailPage
