"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useUser } from "@clerk/nextjs"
import { docSchema } from "../../types/zod"
import type { z } from "zod"
import { ApiError } from "../../lib/api"
import { useDocApi } from "../../lib/useDocApi"
import { DesktopSidebar } from "../../components/dashboard/AppSideBar"
import CollectionToolbar, { type SortOrder } from "../../components/dashboard/CollectionToolbar"
import DocCard, { type DashboardDoc } from "../../components/dashboard/DocCard"
import DocListRow from "../../components/dashboard/DocListRow"
import {
  CollectionError,
  CollectionSkeleton,
  EmptyCollection,
  NoSearchResults,
} from "../../components/dashboard/CollectionStates"

type Status = "loading" | "ready" | "error"
type ViewMode = "grid" | "list"

const VIEW_STORAGE_KEY = "talkdoc.collection.view"
const VIEW_EVENT = "talkdoc:collection-view-changed"

function getViewPreference(): ViewMode {
  const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
  return saved === "list" ? "list" : "grid"
}

function subscribeToViewPreference(onChange: () => void) {
  window.addEventListener(VIEW_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(VIEW_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return "Working late"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function Dashboard() {
  const { getDocs } = useDocApi()
  const { user } = useUser()

  const [status, setStatus] = useState<Status>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [sessionExpired, setSessionExpired] = useState(false)
  const [docs, setDocs] = useState<z.infer<typeof docSchema>>([])

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOrder>("newest")

  // The layout preference lives in localStorage (an external store), read
  // through useSyncExternalStore so server and client render consistently.
  const view = useSyncExternalStore(
    subscribeToViewPreference,
    getViewPreference,
    () => "grid" as ViewMode
  )

  const handleViewChange = useCallback((next: ViewMode) => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, next)
    window.dispatchEvent(new Event(VIEW_EVENT))
  }, [])

  const loadDocs = useCallback(async () => {
    try {
      const result = await getDocs()
      setDocs(result)
      setSessionExpired(false)
      setStatus("ready")
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not reach the document service. Check your connection and try again."
      setErrorMessage(message)
      setSessionExpired(error instanceof ApiError && error.status === 401)
      setStatus("error")
    }
  }, [getDocs])

  // Data fetching happens in a promise callback (not a synchronous effect
  // body) so state transitions never cascade during the initial render pass.
  useEffect(() => {
    let cancelled = false
    getDocs()
      .then((result) => {
        if (cancelled) return
        setDocs(result)
        setSessionExpired(false)
        setStatus("ready")
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Could not reach the document service. Check your connection and try again."
        )
        setSessionExpired(error instanceof ApiError && error.status === 401)
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [getDocs])

  const visibleDocs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? docs.filter(
          (doc) =>
            doc.title.toLowerCase().includes(query) ||
            (doc.description ?? "").toLowerCase().includes(query)
        )
      : docs

    const sorted = [...filtered]
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "alpha":
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "alpha-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title))
        break
    }
    return sorted
  }, [docs, search, sort])

  const handleDeleted = useCallback((docId: string) => {
    setDocs((previous) => previous.filter((doc) => doc.id !== docId))
  }, [])

  const handleUploaded = useCallback(() => {
    // The upload response is already the authoritative new document, but
    // refreshing keeps ordering consistent with the backend.
    void loadDocs()
  }, [loadDocs])

  const firstName = user?.firstName ?? user?.username

  return (
    <div className="flex min-h-svh w-full">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={handleViewChange}
          onUploaded={handleUploaded}
        />

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          {/* Header */}
          <header className="mb-8">
            <p className="font-space text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-ivory">Your documents</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Every PDF you upload becomes a conversation. Ask questions, get answers grounded
              in the exact page.
            </p>
          </header>

          {status === "loading" ? (
            <div aria-busy="true" aria-live="polite">
              <span className="sr-only">Loading your documents</span>
              <CollectionSkeleton />
            </div>
          ) : null}

          {status === "error" ? (
            <CollectionError
              message={errorMessage}
              onRetry={() => {
                setStatus("loading")
                void loadDocs()
              }}
              expired={sessionExpired}
            />
          ) : null}

          {status === "ready" ? (
            <>
              <p aria-live="polite" className="mb-5 font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                {search.trim()
                  ? `${visibleDocs.length} of ${docs.length} document${docs.length === 1 ? "" : "s"} match`
                  : `${docs.length} document${docs.length === 1 ? "" : "s"}`}
              </p>

              {docs.length === 0 ? (
                <EmptyCollection />
              ) : visibleDocs.length === 0 ? (
                <NoSearchResults search={search.trim()} onClear={() => setSearch("")} />
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleDocs.map((doc) => (
                    <DocCard key={doc.id} doc={doc as DashboardDoc} onDeleted={handleDeleted} />
                  ))}
                </div>
              ) : (
                <div className="border-t border-border">
                  {visibleDocs.map((doc) => (
                    <DocListRow key={doc.id} doc={doc as DashboardDoc} onDeleted={handleDeleted} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
