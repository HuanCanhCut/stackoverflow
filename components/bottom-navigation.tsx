import { type Href, usePathname, useRouter } from 'expo-router'
import { Bell, CirclePlus, Home, Search, User } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

const navigationItems: {
    href: Href
    pathname: string
    title: string
    icon: typeof Home
}[] = [
    { href: '/(public)', pathname: '/', title: 'Home', icon: Home },
    { href: '/(public)/search', pathname: '/search', title: 'Search', icon: Search },
    { href: '/(protected)/ask', pathname: '/ask', title: 'Đặt câu hỏi', icon: CirclePlus },
    { href: '/(protected)/notifications', pathname: '/notifications', title: 'Thông báo', icon: Bell },
    { href: '/(protected)/profile', pathname: '/profile', title: 'Hồ sơ', icon: User },
]

const BottomNavigation = () => {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <View className="h-14 flex-row border-t border-[#e2e8f0] bg-white" accessibilityRole="tablist">
            {navigationItems.map((item) => {
                const isActive = pathname === item.pathname
                const color = isActive ? '#f97316' : '#64748b'
                const Icon = item.icon

                return (
                    <Pressable
                        key={item.pathname}
                        className="flex-1 items-center justify-center py-1.5"
                        accessibilityRole="tab"
                        accessibilityLabel={item.title}
                        accessibilityState={{ selected: isActive }}
                        onPress={() => router.navigate(item.href)}
                    >
                        <Icon color={color} size={22} />
                        <Text style={{ color, fontSize: 11, fontWeight: '500' }}>{item.title}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

export default BottomNavigation
