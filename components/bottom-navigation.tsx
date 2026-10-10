import { useAppSelector } from '@/redux/redux.type'
import { selectUnseenNotificationCount } from '@/redux/selector'
import { type Href, usePathname, useRouter } from 'expo-router'
import { Bell, CirclePlus, Home, MessageCircle, Search, User } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

export const BOTTOM_NAVIGATION_HEIGHT = 56

const navigationItems: {
    href: Href
    pathname: string
    title: string
    icon: typeof Home
}[] = [
    { href: '/(public)', pathname: '/', title: 'Home', icon: Home },
    { href: '/(public)/search', pathname: '/search', title: 'Search', icon: Search },
    { href: '/(protected)/ask', pathname: '/ask', title: 'Đặt câu hỏi', icon: CirclePlus },
    { href: '/(protected)/conversations', pathname: '/conversations', title: 'Tin nhắn', icon: MessageCircle },
    { href: '/(protected)/notifications', pathname: '/notifications', title: 'Thông báo', icon: Bell },
    { href: '/(protected)/profile', pathname: '/profile', title: 'Hồ sơ', icon: User },
]

const BottomNavigation = () => {
    const pathname = usePathname()
    const router = useRouter()
    const unseenNotificationCount = useAppSelector(selectUnseenNotificationCount)

    return (
        <View
            className="flex-row border-t border-[#e2e8f0] bg-white"
            style={{ height: BOTTOM_NAVIGATION_HEIGHT }}
            accessibilityRole="tablist"
        >
            {navigationItems.map((item) => {
                const isActive = pathname === item.pathname
                const color = isActive ? '#f97316' : '#64748b'
                const Icon = item.icon
                // Badge chấm đỏ cho mục Thông báo khi còn thông báo chưa nhìn
                const showBadge = item.pathname === '/notifications' && unseenNotificationCount > 0

                return (
                    <Pressable
                        key={item.pathname}
                        className="flex-1 items-center justify-center py-1.5"
                        accessibilityRole="tab"
                        accessibilityLabel={item.title}
                        accessibilityState={{ selected: isActive }}
                        onPress={() => router.navigate(item.href)}
                    >
                        <View>
                            <Icon color={color} size={22} />
                            {showBadge ? (
                                <View className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
                            ) : null}
                        </View>
                        <Text style={{ color, fontSize: 11, fontWeight: '500' }} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

export default BottomNavigation
