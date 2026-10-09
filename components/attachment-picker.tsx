import { putFile, toS3ContentType } from '@/lib/upload'
import { getPresignedUrls } from '@/services/attachmentServices'
import { S3Folder } from '@/types/model/attachment.type'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { ImagePlus, X } from 'lucide-react-native'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, View } from 'react-native'
import ImageView from '@/components/image-viewer'
import { SafeAreaView } from 'react-native-safe-area-context'

export type AttachmentItem = {
    id: string
    uri: string
    uploadId?: string
    uploading: boolean
    error?: boolean
}

type AttachmentPickerProps = {
    attachments: AttachmentItem[]
    onChange: Dispatch<SetStateAction<AttachmentItem[]>>
}

const MAX_ATTACHMENTS = 10
const MAX_SIZE_BYTES = 5 * 1024 * 1024

const AttachmentPicker = ({ attachments, onChange }: AttachmentPickerProps) => {
    const [isPicking, setIsPicking] = useState(false)
    const [viewerIndex, setViewerIndex] = useState<number | null>(null)

    const attachmentUris = attachments.map((item) => item.uri).join('|')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recompute when the uri list actually changes
    const viewerImages = useMemo(() => attachments.map((item) => ({ uri: item.uri })), [attachmentUris])

    const pickImages = async () => {
        const remaining = MAX_ATTACHMENTS - attachments.length

        if (remaining <= 0) {
            return
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permission.granted) {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để thêm ảnh đính kèm.')
            return
        }

        setIsPicking(true)

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: remaining,
                quality: 0.8,
            })

            if (result.canceled) {
                return
            }

            const oversized = result.assets.filter((asset) => (asset.fileSize ?? 0) > MAX_SIZE_BYTES)

            if (oversized.length > 0) {
                Alert.alert('Ảnh quá lớn', 'Mỗi ảnh đính kèm tối đa 5MB.')
            }

            const validAssets = result.assets.filter((asset) => (asset.fileSize ?? 0) <= MAX_SIZE_BYTES)

            if (validAssets.length === 0) {
                return
            }

            const newItems: AttachmentItem[] = validAssets.map((asset, index) => ({
                id: `${Date.now()}-${index}-${asset.assetId ?? asset.uri}`,
                uri: asset.uri,
                uploading: true,
            }))

            onChange((current) => [...current, ...newItems])

            try {
                const presignedRes = await getPresignedUrls({
                    files: validAssets.map((asset) => ({
                        folder: S3Folder.QUESTIONS,
                        content_type: toS3ContentType(asset.mimeType),
                    })),
                })

                await Promise.all(
                    presignedRes.data.map(async (presigned, index) => {
                        const item = newItems[index]
                        const asset = validAssets[index]
                        const contentType = toS3ContentType(asset.mimeType)

                        const success = await putFile(item.uri, presigned.presigned_url, contentType)

                        onChange((current) =>
                            current.map((attachment) =>
                                attachment.id === item.id
                                    ? success
                                        ? { ...attachment, uploading: false, uploadId: presigned.upload_id }
                                        : { ...attachment, uploading: false, error: true }
                                    : attachment,
                            ),
                        )
                    }),
                )
            } catch {
                const newItemIds = new Set(newItems.map((item) => item.id))

                onChange((current) =>
                    current.map((attachment) =>
                        newItemIds.has(attachment.id) ? { ...attachment, uploading: false, error: true } : attachment,
                    ),
                )
            }
        } finally {
            setIsPicking(false)
        }
    }

    const removeAttachment = (id: string) => {
        onChange(attachments.filter((item) => item.id !== id))
    }

    return (
        <View className="flex-row flex-wrap gap-2">
            {attachments.map((item, index) => (
                <View key={item.id} className="h-20 w-20 overflow-hidden rounded-md border border-gray-200">
                    <Pressable
                        onPress={() => setViewerIndex(index)}
                        disabled={item.uploading || item.error}
                        className="h-full w-full"
                    >
                        <Image
                            source={{ uri: item.uri }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                    </Pressable>

                    {item.uploading && (
                        <View className="absolute inset-0 items-center justify-center bg-black/30">
                            <ActivityIndicator size="small" color="#fff" />
                        </View>
                    )}

                    {item.error && (
                        <View className="absolute inset-0 items-center justify-center bg-black/40">
                            <Pressable onPress={() => removeAttachment(item.id)} hitSlop={8}>
                                <X size={18} color="#fff" />
                            </Pressable>
                        </View>
                    )}

                    {!item.uploading && !item.error && (
                        <Pressable
                            onPress={() => removeAttachment(item.id)}
                            hitSlop={8}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5"
                        >
                            <X size={12} color="#fff" />
                        </Pressable>
                    )}
                </View>
            ))}

            {attachments.length < MAX_ATTACHMENTS && (
                <Pressable
                    onPress={pickImages}
                    disabled={isPicking}
                    className="h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300"
                >
                    {isPicking ? <ActivityIndicator size="small" /> : <ImagePlus size={22} color="#9ca3af" />}
                </Pressable>
            )}

            <ImageView
                images={viewerImages}
                imageIndex={viewerIndex ?? 0}
                visible={viewerIndex !== null}
                onRequestClose={() => setViewerIndex(null)}
                HeaderComponent={() => (
                    <SafeAreaView edges={['top']} className="flex-row justify-end p-3">
                        <Pressable
                            onPress={() => setViewerIndex(null)}
                            hitSlop={12}
                            className="rounded-full bg-black/40 p-2"
                        >
                            <X size={20} color="#fff" />
                        </Pressable>
                    </SafeAreaView>
                )}
            />
        </View>
    )
}

export default AttachmentPicker
