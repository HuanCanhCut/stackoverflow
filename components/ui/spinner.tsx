import { cn } from '@/lib/utils'
import { Loader2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

const AnimatedLoader = Animated.createAnimatedComponent(Loader2Icon)

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

    return (
        <AnimatedLoader
            role="status"
            aria-label="Loading"
            className={cn('size-4', className)}
            style={animatedStyle}
            {...props}
        />
    )
}

export { Spinner }
