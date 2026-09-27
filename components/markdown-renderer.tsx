import Markdown from 'react-native-markdown-display'
import CodeBlock from './code-block'

type MarkdownRendererProps = {
    children: string
}

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

const MarkdownRenderer = ({ children }: MarkdownRendererProps) => {
    return (
        <Markdown style={markdownStyles} rules={markdownRules}>
            {children}
        </Markdown>
    )
}

export default MarkdownRenderer
