import type { RootState } from './store'

export const selectCurrentUser = (state: RootState) => state.auth.currentUser

export const selectSearchHistory = (state: RootState) => state.searchHistory.keywords
