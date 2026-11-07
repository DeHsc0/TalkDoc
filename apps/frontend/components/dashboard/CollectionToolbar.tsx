"use client"

import { ArrowDownWideNarrow, LayoutGrid, Rows3 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { MobileSidebar } from "./AppSideBar"
import DocUploadDialog from "./DocUploadDialog"

export type SortOrder = "newest" | "oldest" | "alpha" | "alpha-desc"

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Recently uploaded",
  oldest: "Oldest first",
  alpha: "Title A to Z",
  "alpha-desc": "Title Z to A",
}

export default function CollectionToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  onUploaded,
}: {
  search: string
  onSearchChange: (value: string) => void
  sort: SortOrder
  onSortChange: (sort: SortOrder) => void
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
  onUploaded: () => void
}) {
  const [query, setQuery] = useState(search)
  const [lastPropSearch, setLastPropSearch] = useState(search)

  // Re-sync the input when the parent resets the filter (adjust state during
  // render, the React-endorsed alternative to a syncing effect).
  if (search !== lastPropSearch) {
    setLastPropSearch(search)
    setQuery(search)
  }

  // Debounce keystrokes into the parent's filter state.
  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(query), 200)
    return () => clearTimeout(timer)
  }, [query, onSearchChange])

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8">
        <MobileSidebar />

        {/* Search */}
        <div className="relative min-w-0 flex-1 md:max-w-md">
          <label htmlFor="doc-search" className="sr-only">
            Search documents by title or description
          </label>
          <Input
            id="doc-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            className="pr-3 text-base md:text-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-h-9 gap-2 font-space text-[10px] tracking-[0.15em] uppercase"
                aria-label={`Sort documents. Current: ${SORT_LABELS[sort]}`}
              >
                <ArrowDownWideNarrow className="size-3.5" aria-hidden="true" />
                <span className="hidden md:inline">{SORT_LABELS[sort]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => onSortChange(value as SortOrder)}
              >
                <DropdownMenuRadioItem value="newest">Recently uploaded</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alpha">Title A to Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alpha-desc">Title Z to A</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div
            role="group"
            aria-label="Collection layout"
            className="hidden items-center rounded-md border border-border sm:flex"
          >
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 rounded-r-none"
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              onClick={() => onViewChange("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 rounded-l-none border-l border-border"
              aria-pressed={view === "list"}
              aria-label="List view"
              onClick={() => onViewChange("list")}
            >
              <Rows3 className="size-4" />
            </Button>
          </div>

          <DocUploadDialog onUploaded={onUploaded} />
        </div>
      </div>
    </div>
  )
}
