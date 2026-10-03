// Định dạng thời gian tương đối kiểu tiếng Việt: "Vừa xong", "2 phút trước", "1 giờ trước",
// "Hôm qua", "3 ngày trước". Quá 7 ngày thì hiển thị ngày/tháng/năm cụ thể.
const formatRelativeTime = (input: string | Date): string => {
    const date = typeof input === 'string' ? new Date(input) : input
    const diffMs = Date.now() - date.getTime()

    // Phòng trường hợp lệch giờ nhẹ giữa client/server dẫn tới mốc tương lai
    if (diffMs < 0) return 'Vừa xong'

    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return 'Vừa xong'
    if (diffMinutes < 60) return `${diffMinutes} phút trước`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`

    return date.toLocaleDateString('vi-VN')
}

export default formatRelativeTime
