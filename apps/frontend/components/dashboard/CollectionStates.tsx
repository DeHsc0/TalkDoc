"use client"

import { TriangleAlert } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "../ui/skeleton"
import { Button } from "../ui/button"
import DocUploadDialog from "./DocUploadDialog"

export function CollectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="size-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function EmptyCollection() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-20 text-center">
      <p className="font-space text-[10px] tracking-[0.3em] text-amber-signal uppercase">
        Empty collection
      </p>
      <h2 className="mt-4 max-w-md text-balance text-2xl font-medium tracking-tight text-ivory">
        Your document workspace starts here.
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Upload your first PDF and turn it into something you can explore.
      </p>
      <div className="mt-8">
        <DocUploadDialog onUploaded={() => {}} />
      </div>
    </div>
  )
}

export function NoSearchResults({
  search,
  onClear,
}: {
  search: string
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <h2 className="text-lg font-medium tracking-tight text-ivory">
        No documents match “{search}”
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Try a shorter phrase, or search by a different word in the title or description.
      </p>
      <Button variant="outline" size="sm" className="mt-6" onClick={onClear}>
        Clear search
      </Button>
    </div>
  )
}

export function CollectionError({
  message,
  onRetry,
  expired,
}: {
  message: string
  onRetry: () => void
  expired: boolean
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-medium tracking-tight text-ivory">
        Your documents could not be loaded
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
        {expired ? (
          <Button className="bg-amber-signal font-space text-xs font-bold text-primary-foreground hover:bg-amber-signal/90" asChild>
            <Link href="/">Sign in again</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
