import { ReactElement } from 'react'

// Web không có bàn phím ảo cần ẩn. Bọc TouchableWithoutFeedback ở web còn gây lỗi: click vào input
// cũng tính là press của wrapper, Keyboard.dismiss blur luôn input vừa focus nên không gõ được
const DismissKeyboard = ({ children }: { children: ReactElement }) => children

export default DismissKeyboard
