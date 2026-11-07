"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "../ui/button"

const MAX_LENGTH = 600

export default function MessageComposer({
  onSend,
  onStop,
  streaming,
  disabled,
}: {
  onSend: (text: string) => void
  onStop: () => void
  streaming: boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Auto-grow the textarea up to a sensible ceiling.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [value])

  const canSend = !disabled && !streaming && value.trim().length > 0

  const submit = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue("")
  }

  return (
    <div className="border-t border-border p-3 md:p-4">
      <div className="flex items-end gap-2 rounded-lg border border-input bg-surface p-2 focus-within:border-amber-signal/40">
        <label htmlFor="chat-composer" className="sr-only">
          Ask a question about this document
        </label>
        <textarea
          id="chat-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder="Ask your document…"
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-ivory placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-60 sm:text-sm"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        {streaming ? (
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Stop generating"
            onClick={onStop}
          >
            <Square className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0 bg-amber-signal text-primary-foreground hover:bg-amber-signal/90"
            disabled={!canSend}
            aria-label="Send message"
            onClick={submit}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1">
        <p className="font-space text-[10px] tracking-wider text-muted-foreground/70 uppercase">
          Enter to send · Shift + Enter for a new line
        </p>
        <p
          className={`font-space text-[10px] tracking-wider ${
            value.length >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground/70"
          }`}
          aria-live="polite"
        >
          {value.length}/{MAX_LENGTH}
        </p>
      </div>
    </div>
  )
}
