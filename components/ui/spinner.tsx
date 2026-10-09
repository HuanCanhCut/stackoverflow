import { cn } from '@/lib/utils'
import { Loader2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
    const rotation = useSharedValue(0)

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 800,
                easing: Easing.linear,
            }),
            -1,
            false,
        )
    }, [rotation])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }))

    // Xoay View bọc ngoài thay vì animate thẳng icon SVG: trên web, react-native-svg không nhận được
    // style dạng mảng mà Reanimated cập nhật vào (lỗi "Failed to set an indexed property on CSSStyleDeclaration")
    return (
        <Animated.View role="status" aria-label="Loading" style={animatedStyle}>
            <Loader2Icon className={cn('size-4', className)} {...props} />
        </Animated.View>
    )
}

export { Spinner }
