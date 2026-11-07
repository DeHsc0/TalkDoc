"use client"

import { FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import DeleteDocDialog from "./DeleteDocDialog"
import { formatDate, formatPages, formatSize } from "./format"
import type { DashboardDoc } from "./DocCard"

export default function DocListRow({
  doc,
  onDeleted,
}: {
  doc: DashboardDoc
  onDeleted?: (docId: string) => void
}) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <article className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 transition-colors hover:bg-surface/50 sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_auto] sm:gap-6 sm:px-2">
      <span className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-amber-signal">
        <FileText className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <Link
          href={`/chats/${doc.id}`}
          className="block truncate font-medium tracking-tight text-ivory hover:text-amber-signal"
          title={doc.title}
        >
          {doc.title}
        </Link>
        {doc.description ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{doc.description}</p>
        ) : null}
      </div>

      <dl className="hidden grid-cols-3 gap-6 sm:grid">
        <div>
          <dt className="sr-only">Pages</dt>
          <dd className="font-space text-xs text-muted-foreground">{formatPages(doc.pages)}</dd>
        </div>
        <div>
          <dt className="sr-only">Size</dt>
          <dd className="font-space text-xs text-muted-foreground">{formatSize(doc.size)}</dd>
        </div>
        <div>
          <dt className="sr-only">Added</dt>
          <dd className="font-space text-xs text-muted-foreground">{formatDate(doc.createdAt)}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="hidden font-space text-[10px] tracking-[0.2em] uppercase sm:inline-flex"
          onClick={() => router.push(`/chats/${doc.id}`)}
        >
          Open chat
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-ivory"
              aria-label={`Actions for ${doc.title}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/chats/${doc.id}`)}>
              Open chat
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteDocDialog doc={doc} open={confirmOpen} onOpenChange={setConfirmOpen} onDeleted={onDeleted} />
    </article>
  )
}
