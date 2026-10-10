import { Input } from '@/components/ui/input'
import { useRouter } from 'expo-router'
import { ArrowLeft, ScanSearch, Search } from 'lucide-react-native'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

const BackButton = ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress} hitSlop={8} className="p-2" accessibilityRole="button" accessibilityLabel="Quay lại">
        <ArrowLeft color="#0f172a" size={22} />
    </Pressable>
)

type HeaderProps = {
    variant?: 'default' | 'search'
    searchValue?: string
    onSearchChange?: (value: string) => void
    onSearchSubmit?: () => void
    // Truyền vào thì hiện nút tìm kiếm bằng hình ảnh bên phải ô tìm kiếm
    onImageSearch?: () => void
    isImageSearching?: boolean
}

const Header = ({
    variant = 'default',
    searchValue,
    onSearchChange,
    onSearchSubmit,
    onImageSearch,
    isImageSearching = false,
}: HeaderProps) => {
    const router = useRouter()
    const canGoBack = router.canGoBack()

    if (variant === 'search') {
        return (
            <View className="h-14 flex-row items-center gap-2 border-b border-[#e2e8f0] bg-white px-2">
                {canGoBack && <BackButton onPress={() => router.back()} />}

                <Input
                    value={searchValue}
                    onChangeText={onSearchChange}
                    placeholder="Tìm kiếm câu hỏi..."
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={onSearchSubmit}
                    className="flex-1"
                />

                {onImageSearch && (
                    <Pressable
                        onPress={onImageSearch}
                        disabled={isImageSearching}
                        hitSlop={8}
                        className="p-2"
                        accessibilityRole="button"
                        accessibilityLabel="Tìm kiếm bằng hình ảnh"
                    >
                        {isImageSearching ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <ScanSearch color="#0f172a" size={22} />
                        )}
                    </Pressable>
                )}
            </View>
        )
    }

    return (
        <View className="h-14 flex-row items-center justify-between border-b border-[#e2e8f0] bg-white px-2">
            <View className="flex-row items-center gap-1">
                {canGoBack && <BackButton onPress={() => router.back()} />}

                <Text className="text-lg font-bold text-black">AskHub</Text>
            </View>

            <View className="flex-row items-center">
                <Pressable
                    onPress={() => router.push('/(public)/search')}
                    hitSlop={8}
                    className="p-2"
                    accessibilityRole="button"
                    accessibilityLabel="Tìm kiếm"
                >
                    <Search color="#0f172a" size={22} />
                </Pressable>
            </View>
        </View>
    )
}

export default Header
