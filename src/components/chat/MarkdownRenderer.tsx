import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Check, Copy } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
}

function CodeBlock({
  inline,
  className,
  children,
}: {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return <code className="inline-code">{children}</code>
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.8 }} />
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.8 }} />
          <span className="code-lang-tag" style={{ marginLeft: '6px' }}>{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="copy-code-btn"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({
            inline,
            className,
            children,
            ...props
          }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            return (
              <CodeBlock inline={inline} className={className} {...props}>
                {children}
              </CodeBlock>
            )
          },
          blockquote({ children }) {
            return <blockquote className="pedagogical-callout">{children}</blockquote>
          },
          table({ children }) {
            return (
              <div className="table-responsive">
                <table className="study-table">{children}</table>
              </div>
            )
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="study-link"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
