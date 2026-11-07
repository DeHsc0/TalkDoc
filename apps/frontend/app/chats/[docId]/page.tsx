"use client"

import { Suspense, useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { MessageSquarePlus, PanelLeftOpen, Sparkles, TriangleAlert, User } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"
import ChatSideBar, { HistoryLoading } from "../../../components/chat/ChatSideBar"
import DocumentViewer from "../../../components/chat/DocumentViewer"
import MessageList from "../../../components/chat/MessageList"
import MessageComposer from "../../../components/chat/MessageComposer"
import { useChat } from "../../../lib/useChat"

function ChatHeader({
  docTitle,
  onNew,
}: {
  docTitle: string | null
  onNew: () => void
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 font-space text-sm font-bold tracking-wide text-ivory"
      >
        <span className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-amber-signal">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        TalkDoc
      </Link>
      <span aria-hidden="true" className="hidden text-muted-foreground/50 sm:block">/</span>
      <p className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
        {docTitle ?? "Document chat"}
      </p>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden min-h-9 font-space text-[10px] tracking-[0.15em] uppercase sm:inline-flex"
          onClick={onNew}
        >
          <MessageSquarePlus className="size-3.5" aria-hidden="true" />
          New conversation
        </Button>
        <span
          aria-label="Your profile"
          className="flex size-9 items-center justify-center rounded-full bg-amber-signal/15 text-amber-signal"
        >
          <User className="size-4" aria-hidden="true" />
        </span>
      </div>
    </header>
  )
}

function WelcomeState({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick: (question: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <h2 className="text-balance text-2xl font-medium tracking-tight text-ivory">
        What would you like to understand?
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Ask questions about this document. I&apos;ll help you find the information that matters.
      </p>
      <ul className="mt-2 flex w-full max-w-md flex-col gap-2">
        {suggestions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onPick(question)}
              className="w-full rounded-md border border-border bg-surface px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-amber-signal/30 hover:text-ivory"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const SIDEBAR_KEY = "talkdoc.chat.sidebar-collapsed";
const SPLIT_KEY = "talkdoc.chat.split-percent";
const SPLIT_EVENT = "talkdoc:chat-split-changed";

function getSplitPercent(): number {
  const saved = Number(window.localStorage.getItem(SPLIT_KEY));
  return Number.isFinite(saved) && saved >= 25 && saved <= 70 ? saved : 42;
}
function subscribeSplit(onChange: () => void) {
  window.addEventListener(SPLIT_EVENT, onChange);
  return () => window.removeEventListener(SPLIT_EVENT, onChange);
}
const SIDEBAR_EVENT = "talkdoc:chat-sidebar-changed";

function getSidebarCollapsed(): boolean {
  return window.localStorage.getItem(SIDEBAR_KEY) === "1";
}
function subscribeSidebar(onChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function ChatWorkspace({ docId }: { docId: string }) {
  const chat = useChat(docId)
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsed,
    () => false
  )
  const toggleSidebar = useCallback(() => {
    const next = !getSidebarCollapsed()
    window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0")
    window.dispatchEvent(new Event(SIDEBAR_EVENT))
  }, [])

  const splitPercent = useSyncExternalStore(subscribeSplit, getSplitPercent, () => 42)
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const splitRef = useRef<HTMLDivElement | null>(null)

  const handleSplitDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    event.currentTarget.setPointerCapture(event.pointerId)

    const onMove = (moveEvent: PointerEvent) => {
      const rect = workspace.getBoundingClientRect()
      const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(70, Math.max(25, Math.round(percent)))
      window.localStorage.setItem(SPLIT_KEY, String(clamped))
      window.dispatchEvent(new Event(SPLIT_EVENT))
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)

  // Keep the newest message in view, but never fight a user reading upward.
  useEffect(() => {
    const container = scrollRef.current
    if (!container || !stickToBottomRef.current) return
    container.scrollTop = container.scrollHeight
  }, [chat.messages, chat.toolActive])

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return
    stickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 80
  }

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader docTitle={chat.document?.title ?? null} onNew={chat.startNewConversation} />

      <div ref={workspaceRef} className="flex min-h-0 flex-1">
        <ChatSideBar
          doc={chat.document}
          conversations={chat.conversations}
          conversationsError={chat.conversationsError}
          activeConversationId={chat.activeConversationId}
          onSwitch={chat.switchConversation}
          onNew={chat.startNewConversation}
          collapsed={sidebarCollapsed}
          onCollapse={toggleSidebar}
        />

        {sidebarCollapsed ? (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-16 left-3 z-20 hidden size-9 md:inline-flex"
            aria-label="Expand sidebar"
            onClick={toggleSidebar}
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        ) : null}

        {/* Document panel */}
        <div
          className="hidden min-h-0 border-r border-border lg:block"
          style={{ width: `${splitPercent}%` }}
        >
          {chat.document ? (
            <DocumentViewer doc={chat.document} />
          ) : chat.status === "loading-document" ? (
            <div className="flex h-full flex-col gap-3 p-6" aria-hidden="true">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-6 flex-1" />
            </div>
          ) : null}
        </div>

        {/* Split resizer */}
        <div
          ref={splitRef}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize document and chat panels"
          className="hidden w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-amber-signal/50 md:block"
          onPointerDown={handleSplitDrag}
        />

        {/* Chat column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {chat.status === "loading-document" ? (
            <div className="flex flex-1 items-center justify-center" aria-live="polite">
              <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                Loading document
              </p>
            </div>
          ) : null}

          {chat.status === "error" ? (
            <div
              role="alert"
              className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
            >
              <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {chat.statusError}
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to your documents</Link>
              </Button>
            </div>
          ) : null}

          {chat.status === "ready" ? (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-6 md:px-6"
              >
                <div className="mx-auto max-w-2xl">
                  {chat.historyLoading ? <HistoryLoading /> : null}
                  {chat.historyError ? (
                    <p
                      role="alert"
                      className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    >
                      {chat.historyError}
                    </p>
                  ) : null}

                  {chat.messages.length === 0 && !chat.historyLoading ? (
                    <WelcomeState suggestions={chat.suggestedQuestions} onPick={chat.sendMessage} />
                  ) : (
                    <MessageList
                      messages={chat.messages}
                      streaming={chat.streaming}
                      toolActive={chat.toolActive}
                    />
                  )}
                </div>
              </div>

              {chat.sendError ? (
                <p
                  role="alert"
                  className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive md:mx-6"
                >
                  {chat.sendError}
                </p>
              ) : null}

              <MessageComposer
                onSend={(text) => void chat.sendMessage(text)}
                onStop={chat.stopStreaming}
                streaming={chat.streaming}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ChatWorkspaceContainer() {
  const params = useParams<{ docId: string }>()
  const docId = typeof params?.docId === "string" ? params.docId : ""

  if (!docId) {
    return (
      <div className="flex h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">No document selected.</p>
      </div>
    )
  }
  return <ChatWorkspace docId={docId} />
}

export default function DocumentChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-svh items-center justify-center" aria-live="polite">
          <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            Loading workspace
          </p>
        </div>
      }
    >
      <ChatWorkspaceContainer />
    </Suspense>
  )
}
