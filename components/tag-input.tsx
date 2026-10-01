import { Input } from '@/components/ui/input'
import { getTags } from '@/services/tagServices'
import { TagModel } from '@/types/model/tag.type'
import { X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'

type TagInputProps = {
    tags: string[]
    onChange: (tags: string[]) => void
}

const TagInput = ({ tags, onChange }: TagInputProps) => {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<TagModel[]>([])
    const inputRef = useRef<TextInput>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const keyword = query.trim()

        if (!keyword) {
            setSuggestions([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        const timeoutId = setTimeout(async () => {
            try {
                const res = await getTags({ search: keyword })

                setSuggestions(res.data.filter((tag) => !tags.includes(tag.name)))
            } catch {
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query, tags])

    const addTag = (rawTag: string) => {
        const tag = rawTag.trim().toLowerCase()

        if (!tag || tags.includes(tag)) {
            return
        }

        onChange([...tags, tag])
        setQuery('')
        setSuggestions([])
    }

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag))
    }

    return (
        <View className="gap-2">
            {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                    {tags.map((tag) => (
                        <View key={tag} className="flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5">
                            <Text className="text-sm text-slate-700">{tag}</Text>
                            <Pressable
                                onPress={() => removeTag(tag)}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={`Xoá chủ đề ${tag}`}
                            >
                                <X size={14} color="#64748b" />
                            </Pressable>
                        </View>
                    ))}
                </View>
            )}

            <Input
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Thêm chủ đề (VD: javascript, react-native)"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => addTag(query)}
                returnKeyType="done"
                blurOnSubmit={false}
            />

            {isLoading && (
                <View className="py-2">
                    <ActivityIndicator size="small" />
                </View>
            )}

            {!isLoading && suggestions.length > 0 && (
                <View className="overflow-hidden rounded-md border border-gray-200">
                    {suggestions.map((tag, index) => (
                        <Pressable
                            key={tag.id}
                            onPress={() => addTag(tag.name)}
                            className={`px-3 py-2.5 ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                            <Text className="text-sm">{tag.name}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    )
}

export default TagInput
