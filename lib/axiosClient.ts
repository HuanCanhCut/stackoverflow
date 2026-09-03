import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as secureStorage from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL

// eslint-disable-next-line import/no-named-as-default-member
const axiosClient = axios.create({
    baseURL: BASE_URL,
})

interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

axiosClient.interceptors.request.use(async (config) => {
    const accessToken = await secureStorage.getItemAsync('access_token')

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})

let isRefreshing = false

let failedQueue: {
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
}[] = []

const processQueue = (error?: unknown) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve()
        }
    })

    failedQueue = []
}

const refreshToken = async () => {
    try {
        const refreshToken = await secureStorage.getItemAsync('refresh_token')

        if (!refreshToken) {
            throw new Error('Không tìm thấy refresh token')
        }

        const response = await axios.post(
            `${BASE_URL}/auth/refresh`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            },
        )

        const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data.meta

        await secureStorage.setItemAsync('access_token', newAccessToken)

        if (newRefreshToken) {
            await secureStorage.setItemAsync('refresh_token', newRefreshToken)
        }

        processQueue()
    } catch (error) {
        processQueue(error)
        throw error
    }
}

const getNewToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
        })
    }

    isRefreshing = true

    try {
        await refreshToken()
    } finally {
        isRefreshing = false
    }
}

axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig

        const shouldRenewToken =
            error.response?.status === 401 &&
            !originalRequest._retry &&
            error.response.headers['x-refresh-token-required'] === 'true'

        if (shouldRenewToken) {
            originalRequest._retry = true

            try {
                await getNewToken()

                return axiosClient(originalRequest)
            } catch (refreshError) {
                await secureStorage.deleteItemAsync('access_token')
                await secureStorage.deleteItemAsync('refresh_token')

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

export default axiosClient
