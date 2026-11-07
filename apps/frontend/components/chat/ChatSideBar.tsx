"use client"

import { Download, MessageSquarePlus, PanelLeftClose } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Button } from "../ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"
import type { ConversationEntry, DocumentSummary } from "../../lib/chatApi"

function DocumentCard({ doc }: { doc: DocumentSummary | null }) {
  if (!doc) return null
  return (
    <div className="rounded-lg border border-amber-signal/25 bg-amber-signal/5 p-3">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ivory" title={doc.title}>
          {doc.title}
        </p>
        {doc.url ? (
          <a
            href={doc.url}
            download={`${doc.title}.pdf`}
            aria-label={`Download ${doc.title}`}
            title="Download PDF"
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-amber-signal/40 hover:text-amber-signal"
          >
            <Download className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <p className="mt-1 font-space text-[10px] tracking-wider text-muted-foreground uppercase">
        {doc.pages === null || doc.pages === undefined ? "Page count unknown" : `${doc.pages} pages`}
        {" · "}
        {doc.size === null || doc.size === undefined ? "size unknown" : `${Number(doc.size).toFixed(2)} MB`}
      </p>
    </div>
  )
}

function ConversationList({
  conversations,
  conversationsError,
  activeConversationId,
  onSwitch,
}: {
  conversations: ConversationEntry[]
  conversationsError: string | null
  activeConversationId: string | null
  onSwitch: (id: string) => void
}) {
  if (conversationsError) {
    return (
      <p role="alert" className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {conversationsError}
      </p>
    )
  }
  if (conversations.length === 0) {
    return (
      <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        No conversations yet. Start one with your first question.
      </p>
    )
  }
  return (
    <ul className="space-y-1">
      {conversations.map((entry, index) => {
        const active = entry.id !== null && entry.id === activeConversationId
        const item = (
          <span className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-left">
            <span className={`min-w-0 flex-1 truncate text-sm ${active ? "text-ivory" : "text-muted-foreground"}`}>
              {entry.title}
            </span>
            {active ? (
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-signal" />
            ) : null}
          </span>
        )
        return (
          <li key={entry.id ?? `unknown-${index}`}>
            {entry.id ? (
              <button
                type="button"
                onClick={() => onSwitch(entry.id as string)}
                aria-current={active ? "true" : undefined}
                className={`w-full rounded-md transition-colors hover:bg-surface ${
                  active ? "bg-amber-signal/10" : ""
                }`}
              >
                {item}
              </button>
            ) : (
              <div className="w-full cursor-default opacity-70">{item}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function SidebarContent({
  doc,
  conversations,
  conversationsError,
  activeConversationId,
  onSwitch,
  onNew,
  closeDrawer,
  onCollapse,
}: {
  doc: DocumentSummary | null
  conversations: ConversationEntry[]
  conversationsError: string | null
  activeConversationId: string | null
  onSwitch: (id: string) => void
  onNew: () => void
  closeDrawer?: () => void
  onCollapse?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex min-h-9 w-fit items-center gap-1.5 font-space text-[10px] tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-ivory"
            onClick={closeDrawer}
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
          {onCollapse ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden size-8 text-muted-foreground hover:text-ivory md:inline-flex"
              aria-label="Collapse sidebar"
              onClick={onCollapse}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="mt-4">
          <DocumentCard doc={doc} />
        </div>
        <Button
          onClick={() => {
            onNew()
            closeDrawer?.()
          }}
          className="mt-4 w-full bg-amber-signal font-space text-xs font-bold text-primary-foreground hover:bg-amber-signal/90"
        >
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          New conversation
        </Button>
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-3 pb-2 font-space text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
          Conversations
        </p>
        <ConversationList
          conversations={conversations}
          conversationsError={conversationsError}
          activeConversationId={activeConversationId}
          onSwitch={(id) => {
            onSwitch(id)
            closeDrawer?.()
          }}
        />
      </nav>

      <UserProfile />
    </div>
  )
}

function UserProfile() {
  const { user } = useUser()
  const name = user?.username ?? user?.firstName ?? "You"
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-signal/15 font-space text-xs font-bold text-amber-signal">
        {name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-ivory">{name}</p>
        {user?.primaryEmailAddress?.emailAddress ? (
          <p className="truncate font-space text-[10px] tracking-wider text-muted-foreground uppercase">
            {user.primaryEmailAddress.emailAddress}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function ChatSideBar({
  doc,
  conversations,
  conversationsError,
  activeConversationId,
  onSwitch,
  onNew,
  collapsed,
  onCollapse,
}: {
  doc: DocumentSummary | null
  conversations: ConversationEntry[]
  conversationsError: string | null
  activeConversationId: string | null
  onSwitch: (id: string) => void
  onNew: () => void
  /** Desktop rail only: collapsed hides the rail entirely. */
  collapsed?: boolean
  onCollapse?: () => void
}) {
  return (
    <>
      {/* Desktop rail */}
      {!collapsed ? (
        <aside className="hidden w-72 shrink-0 border-r border-border md:block">
          <div className="sticky top-0 flex h-svh flex-col">
            <SidebarContent
              doc={doc}
              conversations={conversations}
              conversationsError={conversationsError}
              activeConversationId={activeConversationId}
              onSwitch={onSwitch}
              onNew={onNew}
              onCollapse={onCollapse}
            />
          </div>
        </aside>
      ) : null}

      {/* Mobile drawer trigger lives in the header; drawer content here. */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            aria-label="Open conversations"
          >
            Conversations
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <SidebarContent
            doc={doc}
            conversations={conversations}
            conversationsError={conversationsError}
            activeConversationId={activeConversationId}
            onSwitch={onSwitch}
            onNew={onNew}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-9 animate-pulse rounded-md bg-surface/70" />
      ))}
    </div>
  )
}

export function HistoryLoading() {
  return (
    <div className="flex items-center gap-2 px-2 py-3 text-muted-foreground" aria-live="polite">
      <span className="size-3 animate-pulse rounded-full bg-amber-signal" aria-hidden="true" />
      <span className="font-space text-[10px] tracking-[0.2em] uppercase">Loading conversation</span>
    </div>
  )
}
