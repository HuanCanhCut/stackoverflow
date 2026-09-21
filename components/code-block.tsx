import * as Clipboard from 'expo-clipboard'
import { Check, Copy } from 'lucide-react-native'
import { Highlight, themes } from 'prism-react-renderer'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextStyle, View, ViewStyle } from 'react-native'

type CodeBlockProps = {
    language?: string
    value: string
}

const CodeBlock = ({ language, value }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await Clipboard.setStringAsync(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <View className="my-2 overflow-hidden rounded-lg border border-slate-200 bg-[#f2f9ff]">
            <View className="flex-row items-center justify-between px-3 py-1.5 border-b border-slate-200/70">
                <Text className="text-xs text-slate-400">{language || 'text'}</Text>
                <Pressable onPress={handleCopy} hitSlop={8} className="p-1 rounded active:bg-black/5">
                    {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#64748b" />}
                </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Highlight theme={themes.github} code={value.trimEnd()} language={language || 'text'}>
                    {({ tokens, getLineProps, getTokenProps }) => (
                        <View className="px-4 py-3">
                            {tokens.map((line, i) => {
                                const { className: _lineClassName, style: lineStyle, ...lineProps } = getLineProps({
                                    line,
                                })

                                return (
                                    <View key={i} {...lineProps} style={lineStyle as ViewStyle} className="flex-row">
                                        {line.map((token, key) => {
                                            const {
                                                className: _tokenClassName,
                                                style: tokenStyle,
                                                ...tokenProps
                                            } = getTokenProps({ token })

                                            return (
                                                <Text
                                                    key={key}
                                                    {...tokenProps}
                                                    style={[
                                                        { fontFamily: 'monospace', fontSize: 13 },
                                                        tokenStyle as TextStyle,
                                                    ]}
                                                >
                                                    {token.content}
                                                </Text>
                                            )
                                        })}
                                    </View>
                                )
                            })}
                        </View>
                    )}
                </Highlight>
            </ScrollView>
        </View>
    )
}

export default CodeBlock
