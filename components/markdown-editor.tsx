import {
    Bold,
    Code,
    Heading2,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    Table2,
    Undo2,
} from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import CodeBlock from './code-block'

const CODE_LANGUAGES = [
    { label: 'Plain text', value: '' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JSX', value: 'jsx' },
    { label: 'TSX', value: 'tsx' },
    { label: 'CSS', value: 'css' },
    { label: 'HTML', value: 'html' },
    { label: 'JSON', value: 'json' },
    { label: 'Python', value: 'python' },
    { label: 'Bash', value: 'bash' },
    { label: 'SQL', value: 'sql' },
]

type MarkdownEditorProps = {
    markdown?: string
    onChange?: (markdown: string) => void
    className?: string
    ref?: React.Ref<TextInput>
}

type Selection = { start: number; end: number }
type Mode = 'write' | 'preview'

const TABLE_TEMPLATE = '| Header | Header |\n| --- | --- |\n| Cell | Cell |\n'

const MarkdownEditor = ({ markdown, onChange, className = '', ref }: MarkdownEditorProps) => {
    const [value, setValue] = useState(markdown || '')
    const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 })
    const [mode, setMode] = useState<Mode>('write')
    const [languagePickerVisible, setLanguagePickerVisible] = useState(false)

    const inputRef = useRef<TextInput>(null)
    const pendingCodeSelectionRef = useRef<Selection | null>(null)

    const historyRef = useRef<string[]>([markdown || ''])
    const historyIndexRef = useRef(0)
    const skipHistoryRef = useRef(false)

    const setRefs = (node: TextInput | null) => {
        inputRef.current = node

        if (typeof ref === 'function') {
            ref(node)
        } else if (ref) {
            ref.current = node
        }
    }

    const commit = (next: string, nextSelection?: Selection) => {
        setValue(next)
        onChange?.(next)

        if (!skipHistoryRef.current) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
            historyRef.current.push(next)
            historyIndexRef.current = historyRef.current.length - 1
        }

        if (nextSelection) {
            setSelection(nextSelection)
            requestAnimationFrame(() => {
                inputRef.current?.setNativeProps({ selection: nextSelection })
            })
        }
    }

    const undo = () => {
        if (historyIndexRef.current === 0) return

        historyIndexRef.current -= 1
        skipHistoryRef.current = true
        commit(historyRef.current[historyIndexRef.current])
        skipHistoryRef.current = false
    }

    const redo = () => {
        if (historyIndexRef.current === historyRef.current.length - 1) return

        historyIndexRef.current += 1
        skipHistoryRef.current = true
        commit(historyRef.current[historyIndexRef.current])
        skipHistoryRef.current = false
    }

    const wrapSelection = (before: string, after: string = before) => {
        const { start, end } = selection
        const selected = value.slice(start, end)
        const next = value.slice(0, start) + before + selected + after + value.slice(end)

        commit(next, { start: start + before.length, end: start + before.length + selected.length })
    }

    const insertCode = () => {
        const { start, end } = selection
        const selected = value.slice(start, end)

        if (start !== end && !selected.includes('\n')) {
            wrapSelection('`')
            return
        }

        pendingCodeSelectionRef.current = selection
        setLanguagePickerVisible(true)
    }

    const insertCodeBlock = (language: string) => {
        const pending = pendingCodeSelectionRef.current

        setLanguagePickerVisible(false)
        pendingCodeSelectionRef.current = null

        if (!pending) return

        const { start, end } = pending
        const selected = value.slice(start, end)
        const needsLeadingNewline = start > 0 && value[start - 1] !== '\n'
        const needsTrailingNewline = end < value.length && value[end] !== '\n'
        const before = (needsLeadingNewline ? '\n' : '') + '```' + language + '\n'
        const after = '\n```' + (needsTrailingNewline ? '\n' : '')
        const next = value.slice(0, start) + before + selected + after + value.slice(end)

        commit(next, { start: start + before.length, end: start + before.length + selected.length })
    }

    const insertAtLineStart = (prefix: string) => {
        const { start, end } = selection
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)

        commit(next, { start: start + prefix.length, end: end + prefix.length })
    }

    const insertAtCursor = (text: string) => {
        const { start, end } = selection
        const next = value.slice(0, start) + text + value.slice(end)
        const cursor = start + text.length

        commit(next, { start: cursor, end: cursor })
    }

    return (
        <View className={`border border-slate-200 rounded-xl bg-white shadow-xs min-h-100 flex flex-col ${className}`}>
            <View className="flex-row border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <TabButton label="Viết" active={mode === 'write'} onPress={() => setMode('write')} />
                <TabButton label="Xem trước" active={mode === 'preview'} onPress={() => setMode('preview')} />
            </View>

            {mode === 'write' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex-row items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50"
                >
                    <ToolbarButton onPress={undo} icon={<Undo2 size={18} color="#334155" />} />
                    <ToolbarButton onPress={redo} icon={<Redo2 size={18} color="#334155" />} />
                    <Divider />
                    <ToolbarButton onPress={() => wrapSelection('**')} icon={<Bold size={18} color="#334155" />} />
                    <ToolbarButton onPress={() => wrapSelection('_')} icon={<Italic size={18} color="#334155" />} />
                    <ToolbarButton onPress={insertCode} icon={<Code size={18} color="#334155" />} />
                    <Divider />
                    <ToolbarButton
                        onPress={() => insertAtLineStart('## ')}
                        icon={<Heading2 size={18} color="#334155" />}
                    />
                    <ToolbarButton onPress={() => insertAtLineStart('> ')} icon={<Quote size={18} color="#334155" />} />
                    <Divider />
                    <ToolbarButton
                        onPress={() => wrapSelection('[', '](url)')}
                        icon={<Link2 size={18} color="#334155" />}
                    />
                    <ToolbarButton
                        onPress={() => insertAtCursor(TABLE_TEMPLATE)}
                        icon={<Table2 size={18} color="#334155" />}
                    />
                    <ToolbarButton
                        onPress={() => insertAtLineStart('---\n')}
                        icon={<Minus size={18} color="#334155" />}
                    />
                    <Divider />
                    <ToolbarButton onPress={() => insertAtLineStart('- ')} icon={<List size={18} color="#334155" />} />
                    <ToolbarButton
                        onPress={() => insertAtLineStart('1. ')}
                        icon={<ListOrdered size={18} color="#334155" />}
                    />
                </ScrollView>
            )}

            {mode === 'write' ? (
                <TextInput
                    ref={setRefs}
                    className="flex-1 p-4 min-h-[350px] text-slate-800 text-sm"
                    style={{ textAlignVertical: 'top' }}
                    multiline
                    placeholder="Nhập nội dung..."
                    value={value}
                    onChangeText={(text) => commit(text)}
                    onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                />
            ) : (
                <View className="flex-1 p-4 min-h-[350px]">
                    {value.trim() ? (
                        <Markdown style={markdownStyles} rules={markdownRules}>
                            {value}
                        </Markdown>
                    ) : (
                        <Text className="text-slate-400 text-sm">Không có nội dung để xem trước.</Text>
                    )}
                </View>
            )}

            <Modal
                visible={languagePickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLanguagePickerVisible(false)}
            >
                <Pressable className="flex-1 bg-black/30 justify-end" onPress={() => setLanguagePickerVisible(false)}>
                    <Pressable className="bg-white rounded-t-2xl max-h-[70%] p-2" onPress={(e) => e.stopPropagation()}>
                        <Text className="text-sm font-medium text-slate-500 px-3 py-2">Chọn ngôn ngữ code</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {CODE_LANGUAGES.map((lang) => (
                                <Pressable
                                    key={lang.value}
                                    onPress={() => insertCodeBlock(lang.value)}
                                    className="px-3 py-3 rounded-lg active:bg-slate-100"
                                >
                                    <Text className="text-sm text-slate-800">{lang.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}

const TabButton = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} className={`px-4 py-2.5 border-b-2 ${active ? 'border-black' : 'border-transparent'}`}>
        <Text className={`text-sm font-medium ${active ? 'text-black' : 'text-slate-500'}`}>{label}</Text>
    </Pressable>
)

const markdownStyles = {
    body: { color: '#1e293b', fontSize: 14 },
    code_inline: { backgroundColor: '#f1f5f9', color: '#334155' },
    blockquote: { backgroundColor: '#f8fafc', borderLeftColor: '#cbd5e1' },
    hr: { backgroundColor: '#e2e8f0' },
}

const renderCodeNode = (node: { content: string; sourceInfo?: string; key: string }) => {
    let { content } = node

    if (content.endsWith('\n')) {
        content = content.slice(0, -1)
    }

    return <CodeBlock key={node.key} language={node.sourceInfo?.trim()} value={content} />
}

const markdownRules = {
    fence: (node: { content: string; sourceInfo?: string; key: string }) => renderCodeNode(node),
    code_block: (node: { content: string; sourceInfo?: string; key: string }) => renderCodeNode(node),
}

const ToolbarButton = ({ onPress, icon }: { onPress: () => void; icon: React.ReactNode }) => (
    <Pressable onPress={onPress} hitSlop={6} className="p-2 rounded-md active:bg-slate-200">
        {icon}
    </Pressable>
)

const Divider = () => <View className="w-px h-6 bg-slate-200 mx-1" />

MarkdownEditor.displayName = 'MarkdownEditor'

export default MarkdownEditor
