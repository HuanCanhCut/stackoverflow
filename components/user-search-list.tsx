import Avatar from '@/components/avatar'
import { useDebounce } from '@/hooks/use-debounce'
import * as userServices from '@/services/userServices'
import { UserModel } from '@/types/model/user.type'
import handleApiError from '@/utils/handleApiError'
import { UserX } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

type UserSearchListProps = {
    query: string
    onSelect: (user: UserModel) => void
    // Id của user đang được mở hội thoại, để hiện spinner và chặn bấm liên tục
    openingUserId?: number | null
}

/** Kết quả tìm người theo tên / nickname, dùng để bắt đầu hội thoại mới */
const UserSearchList = ({ query, onSelect, openingUserId }: UserSearchListProps) => {
    const [users, setUsers] = useState<UserModel[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const debouncedQuery = useDebounce(query.trim(), 400)

    useEffect(() => {
        // Component chỉ được mount khi đã có từ khóa, nên không cần xóa kết quả khi từ khóa rỗng
        if (!debouncedQuery) return

        // Bỏ qua response của từ khóa cũ trả về muộn để không ghi đè kết quả của từ khóa mới
        let ignore = false

        const search = async () => {
            setIsLoading(true)

            try {
                const res = await userServices.searchUsers({ q: debouncedQuery })

                if (!ignore) {
                    setUsers(res.data)
                }
            } catch (error) {
                if (!ignore) {
                    handleApiError(error)
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        search()

        return () => {
            ignore = true
        }
    }, [debouncedQuery])

    // Đang gõ (chưa hết debounce) hoặc đang gọi API thì coi như đang tìm, tránh nháy "không tìm thấy"
    const isSearching = isLoading || query.trim() !== debouncedQuery

    return (
        <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => onSelect(item)}
                    disabled={!!openingUserId}
                    className="flex-row items-center gap-3 bg-white px-4 py-3 active:bg-slate-50"
                >
                    <Avatar uri={item.avatar_path} size={44} />

                    <View className="flex-1">
                        <Text className="text-base text-slate-900" numberOfLines={1}>
                            {item.full_name}
                        </Text>
                        <Text className="text-sm text-slate-500" numberOfLines={1}>
                            @{item.nickname}
                        </Text>
                    </View>

                    {openingUserId === item.id && <ActivityIndicator size="small" />}
                </Pressable>
            )}
            ItemSeparatorComponent={() => <View className="ml-[72px] h-px bg-slate-100" />}
            ListEmptyComponent={
                isSearching ? (
                    <ActivityIndicator size="small" className="mt-10" />
                ) : (
                    <View className="mt-16 items-center gap-2 px-6">
                        <UserX size={40} color="#94a3b8" />
                        <Text className="text-center text-slate-500">Không tìm thấy người dùng nào</Text>
                    </View>
                )
            }
        />
    )
}

export default UserSearchList
