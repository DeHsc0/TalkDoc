"use client"

import { FileText, MoreHorizontal, Trash2 } from "lucide-react"
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

export type DashboardDoc = {
  id: string
  title: string
  description: string | null | undefined
  pages: number | null | undefined
  size: number | string | null | undefined
  createdAt: string
}

export default function DocCard({
  doc,
  onDeleted,
}: {
  doc: DashboardDoc
  onDeleted?: (docId: string) => void
}) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <article className="group flex h-full flex-col rounded-lg border border-border bg-surface transition-colors hover:border-amber-signal/30">
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-amber-signal">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium tracking-tight text-ivory" title={doc.title}>
            {doc.title}
          </h3>
          {doc.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {doc.description}
            </p>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-ivory"
              aria-label={`Actions for ${doc.title}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/chats/${doc.id}`)}>
              Open chat
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border px-5 py-4">
        <div>
          <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Pages</dt>
          <dd className="mt-1 truncate text-sm text-ivory">{formatPages(doc.pages)}</dd>
        </div>
        <div>
          <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Size</dt>
          <dd className="mt-1 truncate text-sm text-ivory">{formatSize(doc.size)}</dd>
        </div>
        <div>
          <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Added</dt>
          <dd className="mt-1 truncate text-sm text-ivory">{formatDate(doc.createdAt)}</dd>
        </div>
      </dl>

      <Link
        href={`/chats/${doc.id}`}
        className="flex min-h-11 items-center justify-between border-t border-border px-5 font-space text-xs tracking-[0.2em] text-amber-signal uppercase transition-colors hover:bg-amber-signal/5"
      >
        Open chat
        <span aria-hidden="true">→</span>
      </Link>

      <DeleteDocDialog doc={doc} open={confirmOpen} onOpenChange={setConfirmOpen} onDeleted={onDeleted} />
    </article>
  )
}
