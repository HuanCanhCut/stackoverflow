import { cssInterop } from 'nativewind'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

// NativeWind chỉ tự map className cho component lõi của React Native, component thư viện phải đăng ký thêm
cssInterop(KeyboardAwareScrollView, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
})

export default KeyboardAwareScrollView
