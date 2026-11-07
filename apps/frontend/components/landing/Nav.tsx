import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <Link href="/" className="flex items-center gap-2.5 font-space text-sm font-bold tracking-wide text-ivory">
          <span className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-amber-signal">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          TalkDoc
        </Link>

        <div className="flex items-center gap-6 font-space text-xs tracking-widest uppercase">
          <a
            href="#how-it-works"
            className="hidden text-muted-foreground transition-colors hover:text-ivory sm:block"
          >
            How it works
          </a>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-md border border-border bg-surface px-4 py-2 text-ivory transition-colors hover:border-amber-signal/50 hover:text-amber-signal"
            >
              Open dashboard
            </Link>
          </Show>
          <Show when="signed-out">
            <SignUpButton>
              <button className="rounded-md bg-amber-signal px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-amber-signal/90">
                Get started
              </button>
            </SignUpButton>
          </Show>
        </div>
      </nav>
    </header>
  );
}
