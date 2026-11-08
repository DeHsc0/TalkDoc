"use client"

import { FileText, Loader2, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"
import type { DocumentSummary } from "../../lib/chatApi"
import PdfCanvasViewer, { type PdfHighlight } from "./PdfCanvasViewer"

type PdfState =
  | { status: "idle"; url: null; error: null }
  | { status: "loading"; url: null; error: null }
  | { status: "ready"; url: string; error: null }
  | { status: "error"; url: null; error: string }

/**
 * Document viewer. The storage backend serves PDFs as
 * `application/octet-stream`, which browsers download instead of rendering,
 * so the file is fetched and re-wrapped as an `application/pdf` Blob and
 * handed to the custom pdfjs viewer (verified in Chromium). Falls back to a
 * metadata panel when the document has no URL or the fetch fails.
 */
export default function DocumentViewer({
  doc,
  highlight,
}: {
  doc: DocumentSummary | null
  highlight?: PdfHighlight | null
}) {
  const sourceUrl = doc?.url ?? null

  const [pdfState, setPdfState] = useState<PdfState>(
    sourceUrl ? { status: "loading", url: null, error: null } : { status: "idle", url: null, error: null }
  )
  const [lastSourceUrl, setLastSourceUrl] = useState<string | null>(sourceUrl)

  // Reset when the source URL changes (adjust state during render, the
  // React-endorsed alternative to a syncing effect).
  if (sourceUrl !== lastSourceUrl) {
    setLastSourceUrl(sourceUrl)
    setPdfState(
      sourceUrl ? { status: "loading", url: null, error: null } : { status: "idle", url: null, error: null }
    )
  }

  const hasUrl = sourceUrl !== null

  useEffect(() => {
    if (!hasUrl || !sourceUrl) return undefined

    let cancelled = false
    let createdUrl: string | null = null

    fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Storage responded with ${response.status}`)
        }
        return response.blob()
      })
      .then((raw) => {
        if (cancelled) return
        const typed = new Blob([raw], { type: "application/pdf" })
        createdUrl = URL.createObjectURL(typed)
        setPdfState({ status: "ready", url: createdUrl, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setPdfState({
          status: "error",
          url: null,
          error:
            error instanceof Error && /Storage responded/.test(error.message)
              ? "The document file could not be retrieved from storage."
              : "The document file could not be loaded. Check your connection and try again.",
        })
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [hasUrl, sourceUrl])

  if (!doc) return null

  return (
    <section
      aria-label={`Document viewer for ${doc.title}`}
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      {pdfState.status === "loading" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3" aria-live="polite">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            Loading document
          </p>
        </div>
      ) : pdfState.status === "ready" ? (
        <PdfCanvasViewer blobUrl={pdfState.url} title={doc.title} highlight={highlight} />
      ) : pdfState.status === "error" ? (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{pdfState.error}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-amber-signal">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Document preview unavailable
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              This document was uploaded before preview URLs were stored, so the
              original file is not linked here. You can still chat with its
              indexed content.
            </p>
          </div>
          <dl className="grid w-full max-w-xs grid-cols-2 gap-4 border-t border-border pt-4 text-left">
            <div>
              <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Pages</dt>
              <dd className="mt-1 text-sm text-ivory">
                {doc.pages === null || doc.pages === undefined ? "—" : doc.pages}
              </dd>
            </div>
            <div>
              <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Size</dt>
              <dd className="mt-1 text-sm text-ivory">
                {doc.size === null || doc.size === undefined ? "—" : `${Number(doc.size).toFixed(2)} MB`}
              </dd>
            </div>
            <div>
              <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Added</dt>
              <dd className="mt-1 text-sm text-ivory">
                {doc.createdAt
                  ? new Date(doc.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-space text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Indexed</dt>
              <dd className="mt-1 text-sm text-ivory">Ready for questions</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}
