"use client"

import { Fragment, type MouseEvent } from "react"
import type { ChatMessage } from "../../lib/useChat"

/**
 * Minimal, safe markdown-ish renderer. No HTML injection: content is
 * rendered as React nodes only. Supports paragraphs, `- ` lists, `**bold**`,
 * `*italic*`, `` `code` `` spans, ``` fenced code blocks and inline [n]
 * citations rendered as clickable chips.
 */

type CitationClick = (message: ChatMessage, citationIndex: number) => void

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[\d{1,3}\])/g

function renderInline(
  text: string,
  keyPrefix: string,
  message: ChatMessage,
  onCitation?: CitationClick
) {
  const parts = text.split(INLINE_PATTERN)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ivory">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-surface px-1.5 py-0.5 font-space text-[0.85em] text-amber-signal"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    // [n] citation chip.
    const citationMatch = part.match(/^\[(\d{1,3})\]$/)
    if (citationMatch && onCitation) {
      const citationIndex = Number(citationMatch[1])
      const hasReference = Boolean(message.references?.[citationIndex - 1])
      const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        onCitation(message, citationIndex)
      }
      return (
        <button
          key={key}
          type="button"
          onClick={handleClick}
          title={
            hasReference
              ? `Jump to reference ${citationIndex}`
              : `Reference ${citationIndex} unavailable`
          }
          className={`mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 align-baseline font-space text-[10px] transition-colors ${
            hasReference
              ? "border-amber-signal/50 bg-amber-signal/15 text-amber-signal hover:bg-amber-signal/30"
              : "border-border text-muted-foreground"
          }`}
        >
          {citationIndex}
        </button>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-md border border-border bg-surface p-3 font-space text-xs leading-relaxed text-ivory">
      <code>{code}</code>
    </pre>
  )
}

function MessageContent({
  content,
  message,
  onCitation,
}: {
  content: string
  message: ChatMessage
  onCitation?: CitationClick
}) {
  // Separate fenced code blocks first.
  const segments = content.split(/```/)
  return (
    <>
      {segments.map((segment, segmentIndex) => {
        if (segmentIndex % 2 === 1) {
          return <CodeBlock key={`code-${segmentIndex}`} code={segment.replace(/^\n|\n$/g, "")} />
        }

        const blocks = segment.split(/\n{2,}/).filter((block) => block.trim().length > 0)
        return (
          <Fragment key={`text-${segmentIndex}`}>
            {blocks.map((block, blockIndex) => {
              const lines = block.split("\n")
              const isList = lines.every((line) => /^\s*([-*]|\d+\.)\s+/.test(line))
              if (isList) {
                const ordered = /^\s*\d+\./.test(lines[0] ?? "")
                const items = lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="ml-4 list-outside">
                    {renderInline(
                      line.replace(/^\s*([-*]|\d+\.)\s+/, ""),
                      `li-${segmentIndex}-${blockIndex}-${lineIndex}`,
                      message,
                      onCitation
                    )}
                  </li>
                ))
                return ordered ? (
                  <ol key={blockIndex} className="my-2 list-decimal space-y-1 pl-1">
                    {items}
                  </ol>
                ) : (
                  <ul key={blockIndex} className="my-2 list-disc space-y-1 pl-1">
                    {items}
                  </ul>
                )
              }
              return (
                <p key={blockIndex} className="my-2 first:mt-0 last:mb-0">
                  {renderInline(block, `p-${segmentIndex}-${blockIndex}`, message, onCitation)}
                </p>
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}

function StreamingCaret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-[1px] bg-amber-signal align-text-bottom"
    />
  )
}

export default function MessageList({
  messages,
  streaming,
  toolActive,
  onCitation,
}: {
  messages: ChatMessage[]
  streaming: boolean
  toolActive: boolean
  onCitation?: CitationClick
}) {
  const lastAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id

  return (
    <div className="flex flex-col gap-5">
      {messages.map((message) =>
        message.role === "user" ? (
          <article key={message.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg rounded-br-sm bg-raised px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory">
                {message.content}
              </p>
            </div>
          </article>
        ) : (
          <article key={message.id} className="flex justify-start">
            <div className="max-w-[90%] rounded-lg rounded-bl-sm border border-border bg-surface px-4 py-3">
              <div className="text-sm leading-relaxed text-foreground">
                <MessageContent content={message.content} message={message} onCitation={onCitation} />
                {streaming && message.id === lastAssistantId ? <StreamingCaret /> : null}
                {streaming && message.id === lastAssistantId && message.content.length === 0 ? (
                  <p className="font-space text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                    {toolActive ? "Searching your document" : "Thinking"}
                    <span className="animate-pulse">…</span>
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        )
      )}
    </div>
  )
}
