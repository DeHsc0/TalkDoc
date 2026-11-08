"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChatApiError,
  fetchChatHistory,
  fetchConversations,
  type ConversationEntry,
  type DocumentSummary,
} from "./chatApi"
import { ChatStreamError, streamChatMessage, type CitationReference } from "./chatStream"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  references?: CitationReference[]
}

export type ChatStatus = "loading-document" | "ready" | "error"

export function useChat(docId: string) {
  const { getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<ChatStatus>("loading-document")
  const [statusError, setStatusError] = useState<string | null>(null)
  const [document, setDocument] = useState<DocumentSummary | null>(null)

  const [conversations, setConversations] = useState<ConversationEntry[]>([])
  const [conversationsError, setConversationsError] = useState<string | null>(null)

  // null = fresh, not-yet-created conversation.
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [streaming, setStreaming] = useState(false)
  const [toolActive, setToolActive] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  // Guards against stale history responses when switching conversations fast.
  const historyRequestRef = useRef(0)
  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  // Typewriter reveal: deltas arrive in bursts, so incoming text is buffered
  // and revealed character-by-character on animation frames. Users who prefer
  // reduced motion get tokens appended directly.
  const streamTextRef = useRef("")
  const displayedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const assistantIdRef = useRef<string | null>(null)

  const flushTypewriter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const assistantId = assistantIdRef.current
    if (!assistantId) return
    setMessages((previous) =>
      previous.map((message) =>
        message.id === assistantId ? { ...message, content: streamTextRef.current } : message
      )
    )
  }, [])

  const startTypewriter = useCallback((assistantId: string) => {
    assistantIdRef.current = assistantId
    streamTextRef.current = ""
    displayedRef.current = 0

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion) {
      // No animation: tokens render exactly as they arrive.
      return
    }

    const tick = () => {
      const target = streamTextRef.current
      if (displayedRef.current < target.length) {
        // Reveal a pacing window per frame: fast enough to never lag behind
        // a long answer, slow enough to read as a typewriter.
        const remaining = target.length - displayedRef.current
        const step = Math.max(2, Math.ceil(remaining / 8))
        displayedRef.current = Math.min(target.length, displayedRef.current + step)
        const shown = target.slice(0, displayedRef.current)
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantIdRef.current ? { ...message, content: shown } : message
          )
        )
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopTypewriterLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    assistantIdRef.current = null
  }, [])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // URL is the navigation reference for an existing conversation.
  const urlConversationId = searchParams.get("conversationId")

  // Load the conversation list — it also carries the document row itself,
  // so no separate documents request is needed in the chat interface.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus("loading-document")
      setStatusError(null)
      try {
        const result = await fetchConversations(() => getTokenRef.current(), docId)
        if (cancelled) return
        if (!result.doc) {
          setStatus("error")
          setStatusError("This document does not exist in your collection.")
          return
        }
        setDocument(result.doc)
        setConversations(result.conversations)
        setConversationsError(null)
        setStatus("ready")
      } catch (error) {
        if (cancelled) return
        setStatus("error")
        setStatusError(
          error instanceof ChatApiError
            ? error.message
            : "This document could not be loaded."
        )
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [docId])

  const refreshConversations = useCallback(async () => {
    setConversationsError(null)
    try {
      const result = await fetchConversations(() => getTokenRef.current(), docId)
      setConversations(result.conversations)
      // The list response also carries the current document row (including
      // url), so the viewer can pick up preview availability.
      if (result.doc) setDocument(result.doc)
      return result
    } catch (error) {
      setConversationsError(
        error instanceof ChatApiError
          ? error.message
          : "Could not load your conversations for this document."
      )
      return null
    }
  }, [docId])

  const loadHistory = useCallback(
    async (conversationId: string) => {
      const requestToken = ++historyRequestRef.current
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const history = await fetchChatHistory(() => getTokenRef.current(), docId, conversationId)
        // Ignore stale responses after a conversation switch.
        if (historyRequestRef.current !== requestToken) return
        setMessages(
          history.messages.flatMap((row) => [
            { id: `${row.id}-u`, role: "user" as const, content: row.user },
            {
              id: `${row.id}-a`,
              role: "assistant" as const,
              content: row.assistant,
              references: row.references,
            },
          ])
        )
      } catch (error) {
        if (historyRequestRef.current !== requestToken) return
        setHistoryError(
          error instanceof ChatApiError
            ? error.message
            : "Could not load this conversation."
        )
        setMessages([])
      } finally {
        if (historyRequestRef.current === requestToken) setHistoryLoading(false)
      }
    }
  , [docId])

  // Open the conversation referenced in the URL, if any.
  useEffect(() => {
    if (status !== "ready") return
    if (urlConversationId && urlConversationId !== activeConversationId) {
      setActiveConversationId(urlConversationId)
      void loadHistory(urlConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, urlConversationId])

  /** Opens an existing conversation from the sidebar. */
  const switchConversation = useCallback(
    (conversationId: string) => {
      if (streaming) abortRef.current?.abort()
      flushTypewriter()
      stopTypewriterLoop()
      setActiveConversationId(conversationId)
      setSendError(null)
      setMessages([])
      router.replace(`/chats/${docId}?conversationId=${conversationId}`, { scroll: false })
      void loadHistory(conversationId)
    },
    [docId, flushTypewriter, loadHistory, router, stopTypewriterLoop, streaming]
  )

  /** Starts a fresh, not-yet-created conversation. No backend call. */
  const startNewConversation = useCallback(() => {
    if (streaming) abortRef.current?.abort()
    flushTypewriter()
    stopTypewriterLoop()
    setActiveConversationId(null)
    setMessages([])
    setSendError(null)
    setHistoryError(null)
    router.replace(`/chats/${docId}`, { scroll: false })
  }, [docId, flushTypewriter, router, stopTypewriterLoop, streaming])

  /** Sends a message and streams the assistant response. */
  const sendMessage = useCallback(
    async (searchQuery: string) => {
      if (streaming || !searchQuery.trim()) return

      const userMessage: ChatMessage = {
        id: `local-u-${Date.now()}`,
        role: "user",
        content: searchQuery,
      }
      const assistantId = `local-a-${Date.now()}`
      const conversationIdAtSend = activeConversationId

      setMessages((previous) => [
        ...previous,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ])
      setSendError(null)
      setToolActive(false)
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      let sawToolActivity = false
      startTypewriter(assistantId)

      // The backend does not emit the new conversation's id in the stream;
      // it is discovered afterwards by diffing the refreshed list.
      const knownConversationIds = new Set(
        conversations.flatMap((entry) => (entry.id ? [entry.id] : []))
      )

      try {
        await streamChatMessage(
          () => getTokenRef.current(),
          {
            searchQuery,
            docId,
            // Property is omitted entirely when undefined (new conversation).
            conversationId: conversationIdAtSend ?? undefined,
          },
          {
            onTextDelta: (delta) => {
              setToolActive(false)
              streamTextRef.current += delta
            },
            onResult: ({ result, references }) => {
              setToolActive(false)
              // The structured payload replaces the running reveal buffer;
              // the typewriter loop animates its contents in.
              streamTextRef.current = result
              setMessages((previous) =>
                previous.map((message) =>
                  message.id === assistantId ? { ...message, references } : message
                )
              )
            },
            onToolActivity: () => {
              sawToolActivity = true
              setToolActive(true)
            },
            onConversationId: (id) => {
              setActiveConversationId(id)
            },
          },
          controller.signal
        )

        // Reveal everything the stream delivered.
        flushTypewriter()
        stopTypewriterLoop()

        // The backend never ends the response nor emits the conversation id,
        // so the fresh id (first message of a new conversation) is picked up
        // from the refreshed list: it is the entry that was not there before.
        const refreshed = await refreshConversations()
        const freshConversation = refreshed?.conversations.find(
          (entry) => entry.id && !knownConversationIds.has(entry.id)
        )
        if (freshConversation?.id) {
          setActiveConversationId(freshConversation.id)
          router.replace(`/chats/${docId}?conversationId=${freshConversation.id}`, {
            scroll: false,
          })
        }
      } catch (error) {
        flushTypewriter()
        stopTypewriterLoop()
        const message =
          error instanceof ChatStreamError
            ? error.message
            : "The assistant could not answer. Try again."
        setSendError(message)
        // Drop the empty assistant placeholder so the user's message stays
        // editable and resendable. If partial output arrived, keep it visible.
        setMessages((previous) =>
          streamTextRef.current.length > 0
            ? previous
            : previous.filter((entry) => entry.id !== assistantId)
        )
      } finally {
        flushTypewriter()
        stopTypewriterLoop()
        if (!sawToolActivity) setToolActive(false)
        setStreaming(false)
        abortRef.current = null
      }
    },
    [
      activeConversationId,
      conversations,
      docId,
      flushTypewriter,
      refreshConversations,
      router,
      startTypewriter,
      stopTypewriterLoop,
      streaming,
    ]
  )

  /** Aborts an in-flight stream; partial output is kept. */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  /**
   * Resolves a [n] citation to its reference. Citations are 1-based:
   * references[index - 1]. Returns null when the reference is missing or
   * has no usable page number — callers degrade gracefully.
   */
  const resolveCitation = useCallback(
    (message: ChatMessage, citationIndex: number): { pageNumber: number; pageContent: string } | null => {
      const reference = message.references?.[citationIndex - 1]
      if (!reference || typeof reference.pageNumber !== "number" || !reference.pageContent) {
        return null
      }
      return { pageNumber: reference.pageNumber, pageContent: reference.pageContent }
    },
    []
  )

  const suggestedQuestions = useMemo(
    () => [
      "What specific requirements or rules does this document define?",
      "Which exact dates, numbers, and names does it mention, and on which pages?",
      "What precisely does the first page say this document is about?",
    ],
    []
  )

  return {
    status,
    statusError,
    document,
    conversations,
    conversationsError,
    activeConversationId,
    messages,
    historyLoading,
    historyError,
    streaming,
    toolActive,
    sendError,
    suggestedQuestions,
    refreshConversations,
    switchConversation,
    startNewConversation,
    sendMessage,
    stopStreaming,
    resolveCitation,
  }
}
