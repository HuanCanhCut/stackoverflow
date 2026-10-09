import { ReactElement } from 'react'
import { Keyboard, TouchableWithoutFeedback } from 'react-native'

// Chạm ra ngoài input thì ẩn bàn phím. Web dùng dismiss-keyboard.web.tsx
const DismissKeyboard = ({ children }: { children: ReactElement }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{children}</TouchableWithoutFeedback>
)

export default DismissKeyboard
