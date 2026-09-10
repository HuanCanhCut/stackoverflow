import { isAxiosError } from 'axios'
import { UserModel } from '@/types/model/user.type'
import { createSlice, type Dispatch } from '@reduxjs/toolkit'
import * as meService from '@/services/meService'
import { toast } from 'sonner-native'

const initialState: {
    currentUser: UserModel | null
} = {
    currentUser: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCurrentUser: (state, { payload }: { payload: UserModel | null }) => {
            state.currentUser = payload
        },
    },
})

export const getCurrentUser = () => {
    return async (dispatch: Dispatch) => {
        try {
            const { data } = await meService.getCurrentUser()

            dispatch(setCurrentUser(data))
        } catch (error) {
            if (isAxiosError(error) && !error.response) {
                toast.error('Không thể kết nối đến máy chủ')
                return
            }

            dispatch(setCurrentUser(null))
        }
    }
}

export const { setCurrentUser } = authSlice.actions

export default authSlice
