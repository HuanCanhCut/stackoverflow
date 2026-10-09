import { getPresignedUrls } from '@/services/attachmentServices'
import { S3ContentType, S3Folder } from '@/types/model/attachment.type'
import { File, UploadType } from 'expo-file-system'
import type { ImagePickerAsset } from 'expo-image-picker'

const SUPPORTED_CONTENT_TYPES: string[] = Object.values(S3ContentType)

export const toS3ContentType = (mimeType: string | undefined): S3ContentType => {
    if (mimeType && SUPPORTED_CONTENT_TYPES.includes(mimeType)) {
        return mimeType as S3ContentType
    }

    return S3ContentType.JPEG
}

// PUT file thẳng lên S3 qua presigned URL, trả về true nếu thành công
export const putFile = async (uri: string, presignedUrl: string, contentType: string) => {
    try {
        const result = await new File(uri).upload(presignedUrl, {
            httpMethod: 'PUT',
            uploadType: UploadType.BINARY_CONTENT,
            mimeType: contentType,
            headers: { 'Content-Type': contentType },
        })

        return result.status >= 200 && result.status < 300
    } catch {
        return false
    }
}

/**
 * Tải nhiều ảnh lên S3 rồi trả về danh sách upload_id (cùng thứ tự với assets) để gửi kèm API.
 * Chỉ cần một ảnh lỗi là throw, vì các API gắn ảnh nhận cả danh sách một lần.
 */
export const uploadImages = async (assets: ImagePickerAsset[], folder: S3Folder) => {
    const contentTypes = assets.map((asset) => toS3ContentType(asset.mimeType))

    const presignedRes = await getPresignedUrls({
        files: contentTypes.map((contentType) => ({ folder, content_type: contentType })),
    })

    const results = await Promise.all(
        presignedRes.data.map((presigned, index) =>
            putFile(assets[index].uri, presigned.presigned_url, contentTypes[index]),
        ),
    )

    if (results.some((success) => !success)) {
        throw new Error('Tải ảnh lên thất bại, vui lòng thử lại')
    }

    return presignedRes.data.map((presigned) => presigned.upload_id)
}
