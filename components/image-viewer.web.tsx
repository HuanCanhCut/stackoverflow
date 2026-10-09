import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { type ComponentProps, useEffect, useState } from 'react'
import { Image, Modal, Pressable, View } from 'react-native'
import type ImageView from 'react-native-image-viewing'

type ImageViewerProps = Pick<
    ComponentProps<typeof ImageView>,
    'images' | 'imageIndex' | 'visible' | 'onRequestClose' | 'HeaderComponent'
>

/** Bản web đơn giản của react-native-image-viewing: xem ảnh toàn màn hình, chuyển ảnh bằng nút trái / phải */
const ImageViewer = ({ images, imageIndex, visible, onRequestClose, HeaderComponent }: ImageViewerProps) => {
    const [index, setIndex] = useState(imageIndex)

    // Mỗi lần mở lại thì bắt đầu từ ảnh được bấm
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (visible) setIndex(imageIndex)
    }, [visible, imageIndex])

    const source = images[index]

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
            <View className="flex-1 bg-black">
                {source ? <Image source={source} resizeMode="contain" style={{ flex: 1 }} /> : null}

                {index > 0 && (
                    <Pressable
                        onPress={() => setIndex(index - 1)}
                        className="absolute left-3 top-1/2 rounded-full bg-black/40 p-2"
                        accessibilityRole="button"
                        accessibilityLabel="Ảnh trước"
                    >
                        <ChevronLeft size={24} color="#fff" />
                    </Pressable>
                )}

                {index < images.length - 1 && (
                    <Pressable
                        onPress={() => setIndex(index + 1)}
                        className="absolute right-3 top-1/2 rounded-full bg-black/40 p-2"
                        accessibilityRole="button"
                        accessibilityLabel="Ảnh sau"
                    >
                        <ChevronRight size={24} color="#fff" />
                    </Pressable>
                )}

                {HeaderComponent ? (
                    <View className="absolute left-0 right-0 top-0">
                        <HeaderComponent imageIndex={index} />
                    </View>
                ) : null}
            </View>
        </Modal>
    )
}

export default ImageViewer
