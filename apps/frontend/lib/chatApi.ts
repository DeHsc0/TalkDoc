"use client"

import axios from "axios"
import {
  chatHistorySchemaResponse,
  conversationSchemaResponse,
} from "../types/zod"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = "ChatApiError"
  }
}

async function authHeaders(getToken: () => Promise<string | null>) {
  const token = await getToken()
  if (!token) {
    throw new ChatApiError("Your session has expired. Sign in again to continue.", 401)
  }
  return { Authorization: `Bearer ${token}` }
}

function toApiError(error: unknown, fallback: string): ChatApiError {
  if (error instanceof ChatApiError) return error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.message ?? error.response?.data?.error
    return new ChatApiError(
      status === 401
        ? "Your session has expired. Sign in again to continue."
        : typeof serverMessage === "string" && serverMessage.length > 0
          ? serverMessage
          : fallback,
      status
    )
  }
  return new ChatApiError(fallback)
}

export type ConversationEntry = { id: string | null; title: string }

export interface ConversationsResult {
  conversations: ConversationEntry[]
  /** The refreshed document row, including the url used by the PDF viewer. */
  doc: DocumentSummary | null
}

/** Conversation list plus the current document row for a document. */
export async function fetchConversations(
  getToken: () => Promise<string | null>,
  docId: string
): Promise<ConversationsResult> {
  try {
    const response = await axios.get(`${API_BASE_URL}/conversations/${docId}`, {
      headers: await authHeaders(getToken),
    })
    const parsed = conversationSchemaResponse.safeParse(response.data)
    if (!parsed.success) {
      throw new ChatApiError("The conversation list could not be read.")
    }
    const doc = parsed.data.data.doc[0]
    return {
      conversations: parsed.data.data.convos.map((entry) => ({
        id: entry.conversation.id ?? null,
        title: entry.conversation.title,
      })),
      doc: doc ? { ...doc, url: doc.url ?? null } : null,
    }
  } catch (error) {
    throw toApiError(error, "Could not load your conversations for this document.")
  }
}

export interface ChatHistoryMessage {
  id: string
  user: string
  assistant: string
  createdAt: string
  references: { pageNumber: number; pageContent: string }[]
}

export interface ChatHistory {
  docTitle: string | null
  messages: ChatHistoryMessage[]
}

/** History rows store the assistant payload as a JSON string of
 * { result, references } (new) or plain text (older rows). */
function parseStoredAssistant(raw: string): { text: string; references: { pageNumber: number; pageContent: string }[] } {
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as { result?: unknown; references?: unknown }
      if (typeof parsed.result === "string") {
        const references = Array.isArray(parsed.references)
          ? parsed.references.filter(
              (entry): entry is { pageNumber: number; pageContent: string } =>
                typeof entry === "object" &&
                entry !== null &&
                typeof (entry as { pageNumber: unknown }).pageNumber === "number" &&
                typeof (entry as { pageContent: unknown }).pageContent === "string"
            )
          : []
        return { text: parsed.result, references }
      }
    } catch {
      // Fall through to plain text.
    }
  }
  return { text: raw, references: [] }
}

/** Chat history for one conversation. Returns newest-first rows mapped to
 * chronological order. */
export async function fetchChatHistory(
  getToken: () => Promise<string | null>,
  docId: string,
  conversationId: string
): Promise<ChatHistory> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chats/${docId}/${conversationId}`,
      { headers: await authHeaders(getToken) }
    )
    const parsed = chatHistorySchemaResponse.safeParse(response.data)
    if (!parsed.success) {
      throw new ChatApiError("The chat history could not be read.")
    }
    const rows = parsed.data.data.chats.map((row) => row.chats)
    // Backend returns newest-first; render chronological.
    const chronological = [...rows].reverse()
    return {
      docTitle: parsed.data.data.doc[0]?.doc.title ?? null,
      messages: chronological.map((row) => {
        const stored = parseStoredAssistant(row.aiResponse)
        return {
          id: row.id,
          user: row.usersResponse,
          assistant: stored.text,
          createdAt: row.createdAt,
          references: stored.references,
        }
      }),
    }
  } catch (error) {
    throw toApiError(error, "Could not load this conversation.")
  }
}

export interface DocumentSummary {
  id: string
  title: string
  description?: string | null
  pages?: number | null
  size?: number | string | null
  createdAt: string
  url?: string | null
}
