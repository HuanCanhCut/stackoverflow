import { AxiosError } from 'axios'
import Toast from 'react-native-toast-message'

interface ValidationErrorItem {
    field: string
    messages: string[]
}

interface ApiErrorResponse {
    code: string
    errors?: ValidationErrorItem[]
    message?: string
    status_code: number
    path: string
    timestamp: string
}

export const getErrMessageFromAPI = (error: any) => {
    let message = ''

    if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorResponse | undefined
        const statusCode = data?.status_code ?? error.response?.status

        if (statusCode === 400 && data?.code === 'VALIDATION_ERROR' && Array.isArray(data.errors)) {
            message = data.errors.map((err) => `${err.field}: ${err.messages.join(', ')}`).join('\n')

            return message
        }

        if (data?.message && !statusCode?.toString().startsWith('5')) {
            message = data.message
        } else {
            message = 'Có lỗi xảy ra, vui lòng thử lại sau hoặc liên hệ admin để xử lí'
        }
    } else {
        message = error.message
    }

    return message
}

const handleApiError = (error: any, message?: string, toastId?: string | number) => {
    const errorMessage = message || getErrMessageFromAPI(error)

    Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: errorMessage,
    })
}

export default handleApiError
