import { zodResolver } from '@hookform/resolvers/zod'
import { File, UploadType } from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { Camera, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Alert, Modal, Pressable, View } from 'react-native'
import { toast } from 'sonner-native'
import { z } from 'zod'

import Avatar from '@/components/avatar'
import KeyboardAwareScrollView from '@/components/keyboard-aware-scroll-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { getPresignedUrls } from '@/services/attachmentServices'
import { updateCurrentUser } from '@/services/meService'
import { S3ContentType, S3Folder } from '@/types/model/attachment.type'
import { UserModel } from '@/types/model/user.type'
import handleApiError from '@/utils/handleApiError'

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

// Giới hạn trùng với UpdateCurrentUserDto phía backend để tránh lỗi validate server
const profileSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(1, 'Tên không được để trống')
        .max(191, 'Tên không được vượt quá 191 ký tự'),
    nickname: z
        .string()
        .trim()
        .min(1, 'Username không được để trống')
        .max(100, 'Username không được vượt quá 100 ký tự'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const SUPPORTED_CONTENT_TYPES: string[] = Object.values(S3ContentType)

// Chỉ nhận các content-type S3 hỗ trợ, mặc định JPEG cho trường hợp không xác định
const toS3ContentType = (mimeType: string | undefined): S3ContentType =>
    mimeType && SUPPORTED_CONTENT_TYPES.includes(mimeType) ? (mimeType as S3ContentType) : S3ContentType.JPEG

// Tách "Họ và tên" thành first_name/last_name theo đúng cách backend tách khi đăng ký,
// đảm bảo full_name (field tính toán = first + ' ' + last) khớp lại với giá trị người dùng nhập
const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/)

    return {
        first_name: parts.length === 1 ? '' : parts.slice(0, -1).join(' '),
        last_name: parts.slice(-1).join(' '),
    }
}

// Upload 1 ảnh lên S3 qua presigned URL và trả về upload_id.
// Backend sẽ dùng upload_id này để xác thực và tự dựng URL công khai cho avatar_path.
const uploadAvatar = async (uri: string, mimeType: string | undefined): Promise<string> => {
    const contentType = toS3ContentType(mimeType)

    const presignedRes = await getPresignedUrls({
        files: [{ folder: S3Folder.AVATARS, content_type: contentType }],
    })

    const { presigned_url, upload_id } = presignedRes.data[0]

    const result = await new File(uri).upload(presigned_url, {
        httpMethod: 'PUT',
        uploadType: UploadType.BINARY_CONTENT,
        mimeType: contentType,
        headers: { 'Content-Type': contentType },
    })

    if (result.status < 200 || result.status >= 300) {
        throw new Error('Upload ảnh thất bại')
    }

    return upload_id
}

type EditProfileModalProps = {
    visible: boolean
    user: UserModel
    onClose: () => void
    // Trả về user đã cập nhật để màn hình cha đồng bộ lại redux
    onUpdated: (user: UserModel) => void
}

const EditProfileModal = ({ visible, user, onClose, onUpdated }: EditProfileModalProps) => {
    // Ảnh hiển thị trong modal (local uri khi vừa chọn, hoặc avatar hiện tại)
    const [avatarUri, setAvatarUri] = useState<string | null>(user.avatar_path)
    // upload_id của ảnh mới sau khi upload thành công; undefined = người dùng chưa đổi ảnh
    const [avatarUploadId, setAvatarUploadId] = useState<string | undefined>(undefined)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: { full_name: user.full_name ?? '', nickname: user.nickname ?? '' },
    })

    // Mỗi lần mở modal: nạp lại dữ liệu hiện tại và xoá trạng thái ảnh đang chọn dở
    useEffect(() => {
        if (visible) {
            reset({ full_name: user.full_name ?? '', nickname: user.nickname ?? '' })
            setAvatarUri(user.avatar_path)
            setAvatarUploadId(undefined)
        }
    }, [visible, user, reset])

    const pickAvatar = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permission.granted) {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (result.canceled) {
            return
        }

        const asset = result.assets[0]

        if ((asset.fileSize ?? 0) > MAX_AVATAR_SIZE_BYTES) {
            Alert.alert('Ảnh quá lớn', 'Ảnh đại diện tối đa 5MB.')
            return
        }

        // Hiển thị ngay ảnh vừa chọn trong lúc upload chạy nền
        setAvatarUri(asset.uri)
        setIsUploadingAvatar(true)

        try {
            const uploadId = await uploadAvatar(asset.uri, asset.mimeType)
            setAvatarUploadId(uploadId)
        } catch (error) {
            // Upload lỗi thì trả ảnh về giá trị cũ để không lưu nhầm
            handleApiError(error, 'Tải ảnh đại diện lên thất bại, vui lòng thử lại.')
            setAvatarUri(user.avatar_path)
            setAvatarUploadId(undefined)
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const onSubmit = async (data: ProfileFormData) => {
        if (isUploadingAvatar) {
            toast.error('Lỗi', { description: 'Vui lòng đợi ảnh đại diện tải lên xong.' })
            return
        }

        try {
            const { first_name, last_name } = splitFullName(data.full_name)

            const res = await updateCurrentUser({
                first_name,
                last_name,
                nickname: data.nickname.trim(),
                // Chỉ gửi avatar_upload_id khi người dùng thực sự đổi ảnh
                ...(avatarUploadId !== undefined ? { avatar_upload_id: avatarUploadId } : {}),
            })

            onUpdated(res.data)
            toast.success('Thành công', { description: 'Cập nhật hồ sơ thành công.' })
            onClose()
        } catch (error) {
            handleApiError(error)
        }
    }

    const isBusy = isSubmitting || isUploadingAvatar

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-end">
                {/* Nền mờ: chạm ra ngoài để đóng */}
                <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

                <View className="rounded-t-2xl bg-background" style={{ maxHeight: '90%' }}>
                    <KeyboardAwareScrollView
                        contentContainerClassName="p-5 gap-5"
                        keyboardShouldPersistTaps="handled"
                        bottomOffset={16}
                    >
                        {/* Tiêu đề + nút đóng */}
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-bold">Chỉnh sửa hồ sơ</Text>
                            <Pressable onPress={onClose} hitSlop={8}>
                                <X size={22} className="text-muted-foreground" />
                            </Pressable>
                        </View>

                        {/* Ảnh đại diện: chạm để chọn ảnh mới */}
                        <View className="items-center">
                            <Pressable onPress={pickAvatar} disabled={isUploadingAvatar}>
                                <Avatar uri={avatarUri} size={96} />

                                {/* Lớp phủ loading trong lúc upload */}
                                {isUploadingAvatar ? (
                                    <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                ) : (
                                    <View className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-primary p-1.5">
                                        <Camera size={16} color="#fff" />
                                    </View>
                                )}
                            </Pressable>
                            <Text className="mt-2 text-xs text-muted-foreground">Chạm vào ảnh để thay đổi</Text>
                        </View>

                        {/* Họ và tên */}
                        <View className="gap-1.5">
                            <Text className="text-sm font-medium">Họ và tên</Text>
                            <Controller
                                control={control}
                                name="full_name"
                                render={({ field: { value, onChange, onBlur } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Nhập họ và tên"
                                        editable={!isBusy}
                                    />
                                )}
                            />
                            {errors.full_name ? (
                                <Text className="text-xs text-destructive">{errors.full_name.message}</Text>
                            ) : null}
                        </View>

                        {/* Username (nickname) */}
                        <View className="gap-1.5">
                            <Text className="text-sm font-medium">Username</Text>
                            <Controller
                                control={control}
                                name="nickname"
                                render={({ field: { value, onChange, onBlur } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Nhập username"
                                        autoCapitalize="none"
                                        editable={!isBusy}
                                    />
                                )}
                            />
                            {errors.nickname ? (
                                <Text className="text-xs text-destructive">{errors.nickname.message}</Text>
                            ) : null}
                        </View>

                        {/* Hành động */}
                        <View className="mt-1 flex-row gap-3">
                            <Button variant="outline" className="flex-1" onPress={onClose} disabled={isBusy}>
                                <Text>Hủy</Text>
                            </Button>
                            <Button className="flex-1" onPress={handleSubmit(onSubmit)} disabled={isBusy}>
                                <Text>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Text>
                            </Button>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        </Modal>
    )
}

export default EditProfileModal
