import { UserModel } from '@/types/model/user.type'
import { createSlice, type Dispatch } from '@reduxjs/toolkit'
import * as meService from '@/services/meService'

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
        } catch (_) {
            dispatch(setCurrentUser(null))
        }
    }
}

export const { setCurrentUser } = authSlice.actions

export default authSlice
