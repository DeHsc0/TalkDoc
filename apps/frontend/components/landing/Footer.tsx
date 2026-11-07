import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 font-space text-sm font-bold tracking-wide text-ivory">
              <span className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-amber-signal">
                <FileText className="size-4" aria-hidden="true" />
              </span>
              TalkDoc
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Document intelligence for people who read a lot and search even more.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-16 gap-y-3 font-space text-xs tracking-wider uppercase sm:grid-cols-3">
            <div className="space-y-3">
              <p className="text-muted-foreground/60">Product</p>
              <a href="#how-it-works" className="block text-muted-foreground transition-colors hover:text-ivory">How it works</a>
              <a href="#preview" className="block text-muted-foreground transition-colors hover:text-ivory">Preview</a>
              <a href="#benefits" className="block text-muted-foreground transition-colors hover:text-ivory">Why TalkDoc</a>
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground/60">Account</p>
              <Show when="signed-out">
                <SignInButton>
                  <button className="text-muted-foreground transition-colors hover:text-ivory">Sign in</button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className="block text-muted-foreground transition-colors hover:text-ivory">Dashboard</Link>
              </Show>
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground/60">Details</p>
              <p className="text-muted-foreground">Answers grounded in your pages</p>
              <p className="text-muted-foreground">PDF, processed page by page</p>
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 font-space text-[10px] tracking-wider text-muted-foreground/60 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>TalkDoc. All rights reserved.</p>
          <p>Illustrative content shown on this page. No customer data.</p>
        </div>
      </div>
    </footer>
  );
}
