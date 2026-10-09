// Bản web của secure-storage.ts: trình duyệt không có kho lưu trữ bảo mật nên dùng localStorage,
// giữ nguyên API dạng Promise giống expo-secure-store để code gọi không phải phân biệt nền tảng.
// localStorage có thể throw (chế độ riêng tư, bị chặn lưu trữ) nên bọc try/catch như khi không có dữ liệu
export const getItemAsync = async (key: string): Promise<string | null> => {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

export const setItemAsync = async (key: string, value: string): Promise<void> => {
    try {
        localStorage.setItem(key, value)
    } catch {
        // Không lưu được thì người dùng phải đăng nhập lại ở lần tải trang sau
    }
}

export const deleteItemAsync = async (key: string): Promise<void> => {
    try {
        localStorage.removeItem(key)
    } catch {
        // Bỏ qua: không có gì để xoá
    }
}
