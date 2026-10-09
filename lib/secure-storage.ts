// iOS / Android lưu token bằng expo-secure-store (Keychain / Keystore).
// Web dùng secure-storage.web.ts vì expo-secure-store không có bản web (lỗi getValueWithKeyAsync is not a function)
export { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'
