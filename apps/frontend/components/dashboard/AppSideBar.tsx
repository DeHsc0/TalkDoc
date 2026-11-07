"use client"

import { FileText, LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { useState } from "react"

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 font-space text-sm font-bold tracking-wide text-ivory">
      <span className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-amber-signal">
        <FileText className="size-4" aria-hidden="true" />
      </span>
      TalkDoc
    </Link>
  )
}

function UserBlock() {
  const { isLoaded, isSignedIn, signOut } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div className="h-12 rounded-md bg-surface/60" aria-hidden="true" />
  }

  if (!isSignedIn) {
    return (
      <Link
        href="/"
        className="block rounded-md border border-border px-3 py-2 text-center font-space text-xs tracking-wider uppercase text-muted-foreground transition-colors hover:text-ivory"
      >
        Sign in
      </Link>
    )
  }

  const name = user?.username ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Signed in"

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-signal/15 font-space text-xs font-bold text-amber-signal">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ivory">{name}</p>
          {user?.primaryEmailAddress?.emailAddress ? (
            <p className="truncate font-space text-[10px] tracking-wider text-muted-foreground uppercase">
              {user.primaryEmailAddress.emailAddress}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full justify-start font-space text-xs tracking-wider uppercase text-muted-foreground hover:text-ivory"
        onClick={() => void signOut({ redirectUrl: "/" })}
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div>
        <div className="border-b border-border px-5 py-5">
          <Wordmark />
          <p className="mt-1.5 font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            Workspace
          </p>
        </div>

        <nav aria-label="Dashboard" className="px-3 py-4" onClick={onNavigate}>
          <Link
            href="/dashboard"
            aria-current="page"
            className="flex min-h-11 items-center gap-2.5 rounded-md border border-amber-signal/25 bg-amber-signal/10 px-3 font-space text-xs tracking-wider uppercase text-amber-signal"
          >
            <FileText className="size-4" aria-hidden="true" />
            My documents
          </Link>
        </nav>
      </div>

      <div className="px-3 pb-4">
        <UserBlock />
      </div>
    </div>
  )
}

export function DesktopSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-svh flex-col">
        <SidebarBody />
        {children}
      </div>
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Dashboard navigation</SheetTitle>
        </SheetHeader>
        <SidebarBody onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
