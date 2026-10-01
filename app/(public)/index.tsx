import handleApiError from '@/utils/handleApiError'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import * as tagServices from '@/services/tagServices'
import { TagModel } from '@/types/model/tag.type'
import { cn } from '@/lib/utils'
import * as questionServices from '@/services/questionServices'
import { GetQuestionsResponse } from '@/types/api_response/question.type'
import { Card, CardContent } from '@/components/ui/card'
import MarkdownRenderer from '@/components/markdown-renderer'
import Avatar from '@/components/avatar'
import { ArrowDown, ArrowUp, Bookmark, MessageSquare } from 'lucide-react-native'

const HomePage = () => {
    const [tags, setTags] = useState<TagModel[]>([])
    const [activeTag, setActiveTag] = useState<number | null>(null)
    const [questions, setQuestions] = useState<GetQuestionsResponse>()
    const [page, setPage] = useState(1)

    useEffect(() => {
        const getTags = async () => {
            try {
                const { data } = await tagServices.getTags({
                    search: '',
                })

                setTags(data)
            } catch (error) {
                handleApiError(error)
            }
        }

        getTags()
    }, [])

    useEffect(() => {
        const getQuestions = async () => {
            try {
                const res = await questionServices.getQuestions({ page: 1, perPage: 20 })

                setQuestions(res)
            } catch (error) {
                handleApiError(error)
            }
        }

        getQuestions()
    }, [])

    return (
        <View className="flex-1 p-2 gap-4 justify-start">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    gap: 8,
                    alignSelf: 'flex-start',
                }}
            >
                {/* Tất cả */}
                <Pressable
                    onPress={() => setActiveTag(null)}
                    className={cn('px-3 py-2 rounded-lg bg-white items-center justify-center', {
                        'bg-primary': activeTag === null,
                    })}
                >
                    <Text
                        className={cn('text-black', {
                            'text-white': activeTag === null,
                        })}
                    >
                        Tất cả
                    </Text>
                </Pressable>

                {/* Tags */}
                {tags.map((tag: TagModel) => (
                    <Pressable
                        key={tag.id}
                        onPress={() => setActiveTag(tag.id)}
                        className={cn('px-3 py-2 rounded-lg bg-white', {
                            'bg-primary': activeTag === tag.id,
                        })}
                    >
                        <Text
                            className={cn('text-black', {
                                'text-white': activeTag === tag.id,
                            })}
                        >
                            {tag.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
            <FlatList
                data={questions?.data}
                keyExtractor={(item) => {
                    return item.id.toString()
                }}
                contentContainerClassName="gap-3 w-full"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    return (
                        <Card className="w-full px-0!">
                            <CardContent className="px-2">
                                <View className="flex-row">
                                    <View className="pr-2 items-center">
                                        <Pressable className="p-2">
                                            <ArrowUp></ArrowUp>
                                        </Pressable>
                                        <Text className="text-3xl font-bold">{item.vote_count}</Text>
                                        <Pressable className="p-2">
                                            <ArrowDown></ArrowDown>
                                        </Pressable>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center gap-2">
                                            <Avatar uri={item.author?.avatar_path} />
                                            <Text className="font-medium">{item.author?.full_name}</Text>
                                        </View>
                                        <Text className="mt-2 font-bold text-3xl line-clamp-3">{item.title}</Text>
                                        <MarkdownRenderer>{item.body}</MarkdownRenderer>
                                        <View className="mt-2 flex-row gap-2">
                                            {item.tags.map((tag) => {
                                                return (
                                                    <View key={tag.tag_id} className="bg-zinc-50 p-2 rounded-sm w-fit ">
                                                        <Text className="text-xs text-muted-foreground">
                                                            {tag.tag.name}
                                                        </Text>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                        <View className="flex-row gap-3 mt-3">
                                            <Pressable className="flex-row items-center gap-1">
                                                <MessageSquare
                                                    size={16}
                                                    className="mt-0.75 text-muted-foreground"
                                                ></MessageSquare>
                                                <Text className="mb-1">{item.reply_count} câu trả lời</Text>
                                            </Pressable>

                                            <Pressable className="mt-0.5 p-1">
                                                <Bookmark size={16}></Bookmark>
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </CardContent>
                        </Card>
                    )
                }}
            ></FlatList>
        </View>
    )
}

export default HomePage
