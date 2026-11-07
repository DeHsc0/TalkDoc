"use client"

/**
 * TEMPORARY development harness for iterating on the custom PDF viewer.
 * Mounted on the landing route behind ?pdfdev=1 (dev only). Remove when
 * the viewer ships.
 */

import { useEffect, useState } from "react"
import PdfCanvasViewer from "./PdfCanvasViewer"

const HARDCODED_PDF_URL =
  "https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bm4hg5dyczco/b/bucket-20261107-1539/o/2310.08560v2.pdf"

export default function PdfDevHarness() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let created: string | null = null
    fetch(HARDCODED_PDF_URL)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.blob()
      })
      .then((raw) => {
        created = URL.createObjectURL(new Blob([raw], { type: "application/pdf" }))
        setBlobUrl(created)
      })
      .catch(() => setFailed(true))
    return () => {
      if (created) URL.revokeObjectURL(created)
    }
  }, [])

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
          TalkDoc · PDF viewer dev harness
        </p>
        <p className="font-space text-[10px] tracking-wider text-muted-foreground/60 uppercase">
          temporary route
        </p>
      </header>
      {failed ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Could not fetch the hardcoded PDF from storage.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {blobUrl ? (
            <div className="flex min-h-0 w-full flex-1">
              <PdfCanvasViewer blobUrl={blobUrl} title="2310.08560v2" />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Fetching document
            </div>
          )}
        </div>
      )}
    </div>
  )
}
