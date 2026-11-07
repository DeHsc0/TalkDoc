"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minus,
  PanelLeft,
  Plus,
  TriangleAlert,
} from "lucide-react"
import { Button } from "../ui/button"

/**
 * Custom continuous-scroll PDF viewer built on pdfjs-dist.
 * - Lazy page rasterization (only pages near the viewport render)
 * - Thumbnails rail with click-to-jump
 * - True zoom (fit-width base), zoom preserved across re-renders
 * - Keyboard navigation, jump-to-page, download
 */

const pdfjs = () => import("pdfjs-dist")
const WORKER_SRC = "/pdf.worker.min.mjs"

type RenderTask = { cancel: () => void; promise: Promise<unknown> }
interface PageSize {
  width: number
  height: number
}

export default function PdfCanvasViewer({
  blobUrl,
  title,
}: {
  blobUrl: string
  title: string
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const thumbRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const renderTasksRef = useRef<Map<string, RenderTask>>(new Map())
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const pageSizesRef = useRef<Map<number, PageSize>>(new Map())
  const renderedMainRef = useRef<Set<number>>(new Set())
  const renderedThumbRef = useRef<Set<number>>(new Set())
  const zoomRef = useRef(1)

  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"loading" | "measuring" | "ready">("loading")
  const [showThumbs, setShowThumbs] = useState(true)
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set())

  zoomRef.current = zoom

  /** Renders one page into a target container at a CSS width. */
  const rasterize = useCallback(
    async (pageNumber: number, target: HTMLElement, cssWidth: number, cacheKey: string) => {
      const doc = docRef.current
      if (!doc) return

      const existing = renderTasksRef.current.get(cacheKey)
      if (existing) {
        existing.cancel()
        renderTasksRef.current.delete(cacheKey)
      }

      const size = pageSizesRef.current.get(pageNumber)
      const scaleFactor = cssWidth / (size?.width ?? cssWidth)
      const dpr = window.devicePixelRatio || 1
      const scale = scaleFactor * dpr

      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })

      // Pages own a React-rendered canvas; pdfjs only draws into it.
      const canvas = target.querySelector<HTMLCanvasElement>("canvas")
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = cssWidth * (viewport.height / viewport.width) + "px"
      const context = canvas.getContext("2d")
      if (!context) return

      const task = page.render({ canvas, canvasContext: context, viewport })
      renderTasksRef.current.set(cacheKey, task)
      try {
        await task.promise
        if (renderTasksRef.current.get(cacheKey) === task) {
          renderTasksRef.current.delete(cacheKey)
          setRenderedPages((previous) => new Set(previous).add(pageNumber))
        }
      } catch {
        // Cancelled renders reject; whatever is on the canvas stays.
      }
    },
    []
  )

  /** Renders a main-view page at the current zoom (fit-width base). */
  const renderMainPage = useCallback(
    (pageNumber: number) => {
      const container = pageRefs.current.get(pageNumber)
      if (!container) return
      const fitWidth = (scrollRef.current?.clientWidth ?? 600) - 32
      void rasterize(pageNumber, container, Math.max(240, fitWidth * zoomRef.current), `main-${pageNumber}`)
    },
    [rasterize]
  )

  /** Renders a thumbnail at a fixed small width. */
  const renderThumbPage = useCallback(
    (pageNumber: number) => {
      const container = thumbRefs.current.get(pageNumber)
      if (!container) return
      void rasterize(pageNumber, container, 104, `thumb-${pageNumber}`)
    },
    [rasterize]
  )

  // Load the document and measure every page's aspect ratio up front so
  // placeholders reserve the right height before rasterization.
  useEffect(() => {
    let cancelled = false
    const tasks = renderTasksRef.current
    const mainRendered = renderedMainRef.current
    const thumbRendered = renderedThumbRef.current

    async function load() {
      setPhase("loading")
      setError(null)
      setCurrentPage(1)
      setRenderedPages(new Set())
      mainRendered.clear()
      thumbRendered.clear()
      pageSizesRef.current.clear()
      try {
        const lib = await pdfjs()
        lib.GlobalWorkerOptions.workerSrc = WORKER_SRC
        const doc = await lib.getDocument({ url: blobUrl }).promise
        if (cancelled) {
          void doc.destroy()
          return
        }
        docRef.current = doc
        setPageCount(doc.numPages)
        setPhase("measuring")
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const page = await doc.getPage(pageNumber)
          if (cancelled) return
          const viewport = page.getViewport({ scale: 1 })
          pageSizesRef.current.set(pageNumber, {
            width: viewport.width,
            height: viewport.height,
          })
        }
        if (cancelled) return
        setPhase("ready")
      } catch {
        if (!cancelled) setError("The PDF could not be rendered in this browser.")
      }
    }

    void load()
    return () => {
      cancelled = true
      tasks.forEach((task) => task.cancel())
      tasks.clear()
      mainRendered.clear()
      thumbRendered.clear()
      const doc = docRef.current
      if (doc) {
        void doc.destroy()
        docRef.current = null
      }
    }
  }, [blobUrl])

  // Lazy render + current-page tracking for the main view.
  useEffect(() => {
    if (phase !== "ready" || pageCount === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page)
          if (entry.isIntersecting && !renderedMainRef.current.has(pageNumber)) {
            renderedMainRef.current.add(pageNumber)
            renderMainPage(pageNumber)
          }
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setCurrentPage(pageNumber)
          }
        }
      },
      { root: scrollRef.current, rootMargin: "400px 0px", threshold: [0, 0.5] }
    )
    pageRefs.current.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [phase, pageCount, renderMainPage])

  // Lazy render for thumbnails.
  useEffect(() => {
    if (phase !== "ready" || !showThumbs || pageCount === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page)
          if (entry.isIntersecting && !renderedThumbRef.current.has(pageNumber)) {
            renderedThumbRef.current.add(pageNumber)
            renderThumbPage(pageNumber)
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0 }
    )
    thumbRefs.current.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [phase, showThumbs, pageCount, renderThumbPage])

  // Re-render the main view when zoom changes (canvas keys are per-page so
  // cancelling and re-rendering in place is safe).
  useEffect(() => {
    if (phase !== "ready" || pageCount === 0) return
    renderedMainRef.current.clear()
    const visible = new Set<number>()
    pageRefs.current.forEach((element, pageNumber) => {
      const rect = element.getBoundingClientRect()
      if (rect.bottom > 0 && rect.top < window.innerHeight) visible.add(pageNumber)
    })
    visible.forEach((pageNumber) => {
      renderedMainRef.current.add(pageNumber)
      renderMainPage(pageNumber)
    })
  }, [zoom, phase, pageCount, renderMainPage])

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), pageCount)
      const element = pageRefs.current.get(clamped)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        setCurrentPage(clamped)
      }
    },
    [pageCount]
  )

  const setZoomClamped = useCallback((next: number) => {
    setZoom(Math.min(4, Math.max(0.25, Number(next.toFixed(2)))))
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault()
        goToPage(currentPage + 1)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault()
        goToPage(currentPage - 1)
      } else if (event.key === "Home") {
        event.preventDefault()
        goToPage(1)
      } else if (event.key === "End") {
        event.preventDefault()
        goToPage(pageCount)
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        setZoomClamped(zoomRef.current + 0.25)
      } else if (event.key === "-") {
        event.preventDefault()
        setZoomClamped(zoomRef.current - 0.25)
      } else if (event.key === "0") {
        event.preventDefault()
        setZoomClamped(1)
      }
    },
    [goToPage, pageCount, setZoomClamped]
  )

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2"
        role="toolbar"
        aria-label="PDF controls"
      >
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 ${showThumbs ? "text-amber-signal" : "text-muted-foreground"}`}
          aria-label={showThumbs ? "Hide thumbnails" : "Show thumbnails"}
          aria-pressed={showThumbs}
          onClick={() => setShowThumbs((previous) => !previous)}
        >
          <PanelLeft className="size-4" />
        </Button>

        <div className="flex items-center overflow-hidden rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="First page"
            disabled={currentPage <= 1}
            onClick={() => goToPage(1)}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <label className="sr-only" htmlFor="pdf-page-input">
            Current page
          </label>
          <input
            id="pdf-page-input"
            type="number"
            min={1}
            max={pageCount}
            value={currentPage}
            onChange={(event) => {
              const parsed = Number(event.target.value)
              if (Number.isFinite(parsed) && parsed >= 1 && parsed <= pageCount) {
                setCurrentPage(parsed)
                goToPage(parsed)
              }
            }}
            className="h-8 w-12 border-x border-border bg-transparent text-center font-space text-xs text-ivory [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="px-2 font-space text-[10px] tracking-wider text-muted-foreground uppercase">
            / {pageCount || "…"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="Next page"
            disabled={currentPage >= pageCount}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="Last page"
            disabled={currentPage >= pageCount}
            onClick={() => goToPage(pageCount)}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center overflow-hidden rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="Zoom out"
            onClick={() => setZoomClamped(zoom - 0.25)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-14 border-x border-border px-2 py-1 text-center font-space text-xs text-ivory">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none"
            aria-label="Zoom in"
            onClick={() => setZoomClamped(zoom + 0.25)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none border-l border-border"
            aria-label="Fit to width"
            title="Fit to width (0)"
            onClick={() => setZoomClamped(1)}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>

        <a
          href={blobUrl}
          download={`${title}.pdf`}
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 font-space text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-ivory"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Download
        </a>
      </div>

      {/* Body: thumbnails + pages */}
      <div className="flex min-h-0 flex-1">
        {showThumbs ? (
          <nav
            aria-label="Page thumbnails"
            className="hidden min-h-0 w-32 shrink-0 overflow-y-auto border-r border-border bg-surface/50 p-2 sm:block"
          >
            <div className="flex flex-col gap-2">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
                const size = pageSizesRef.current.get(page)
                const ratio = size ? size.height / size.width : 1.414
                return (
                  <button
                    key={page}
                    data-page={page}
                    type="button"
                    ref={(element) => {
                      if (element) thumbRefs.current.set(page, element)
                      else thumbRefs.current.delete(page)
                    }}
                    onClick={() => goToPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === currentPage ? "true" : undefined}
                    className={`block w-full overflow-hidden rounded-sm border transition-colors ${
                      page === currentPage
                        ? "border-amber-signal/60"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className="relative" style={{ aspectRatio: `1 / ${ratio}` }}>
                      <canvas className="block h-full w-full" aria-hidden="true" />
                      {!renderedPages.has(page) ? (
                        <div
                          className="absolute inset-0 animate-pulse bg-ivory/10"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <span
                      className={`block py-0.5 text-center font-space text-[9px] ${
                        page === currentPage ? "text-amber-signal" : "text-muted-foreground"
                      }`}
                    >
                      {page}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>
        ) : null}

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto bg-[oklch(0.13_0.008_70)] px-4 py-5"
          tabIndex={0}
          aria-label={`PDF pages for ${title}`}
          onKeyDown={handleKeyDown}
        >
          {phase !== "ready" ? (
            <div className="flex h-full items-center justify-center gap-3" aria-live="polite">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                {phase === "loading" ? "Opening document" : "Measuring pages"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
                const size = pageSizesRef.current.get(page)
                const ratio = size ? size.height / size.width : 1.414
                const width = Math.max(240, (scrollRef.current?.clientWidth ?? 600) - 32) * zoom
                return (
                  <div
                    key={page}
                    data-page={page}
                    ref={(element) => {
                      if (element) pageRefs.current.set(page, element)
                      else pageRefs.current.delete(page)
                    }}
                    className={`relative w-full shrink-0 overflow-hidden rounded-sm bg-white shadow-lg shadow-black/40 ${
                      page === currentPage ? "ring-1 ring-amber-signal/40" : ""
                    }`}
                    style={{ maxWidth: `${width}px`, aspectRatio: `1 / ${ratio}` }}
                    aria-label={`Page ${page}`}
                  >
                    <canvas className="block h-auto w-full" aria-hidden="true" />
                    {!renderedPages.has(page) ? (
                      <div
                        className="absolute inset-0 animate-pulse bg-stone-200"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
