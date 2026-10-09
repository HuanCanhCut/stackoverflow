export enum S3Folder {
    AVATARS = 'avatars',
    QUESTIONS = 'questions',
    MESSAGES = 'messages',
}

export enum S3ContentType {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
    WEBP = 'image/webp',
    JPG = 'image/jpg',
    GIF = 'image/gif',
}

export interface PresignedUrlModel {
    presigned_url: string
    upload_id: string
}
