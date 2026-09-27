import { createSlice } from '@reduxjs/toolkit'

// Số từ khoá tìm kiếm gần đây được giữ lại
const MAX_HISTORY = 5

const initialState: {
    keywords: string[]
} = {
    keywords: [],
}

const searchHistorySlice = createSlice({
    name: 'searchHistory',
    initialState,
    reducers: {
        addSearchKeyword: (state, { payload }: { payload: string }) => {
            const keyword = payload.trim()

            if (!keyword) {
                return
            }

            // Đưa từ khoá lên đầu, bỏ bản trùng (không phân biệt hoa thường)
            state.keywords = [
                keyword,
                ...state.keywords.filter((k) => k.toLowerCase() !== keyword.toLowerCase()),
            ].slice(0, MAX_HISTORY)
        },
        removeSearchKeyword: (state, { payload }: { payload: string }) => {
            state.keywords = state.keywords.filter((k) => k !== payload)
        },
        clearSearchHistory: (state) => {
            state.keywords = []
        },
    },
})

export const { addSearchKeyword, removeSearchKeyword, clearSearchHistory } = searchHistorySlice.actions

export default searchHistorySlice
