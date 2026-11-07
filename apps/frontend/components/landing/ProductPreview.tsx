import Reveal from "./Reveal";
import { FileText, Quote, CornerDownRight } from "lucide-react";

/**
 * Illustrative interface preview with sample content only.
 * No backend connection, no real documents or conversations.
 */
export default function ProductPreview() {
  return (
    <section id="preview" aria-labelledby="preview-heading" className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-28 md:px-10 md:py-36">
        <Reveal>
          <p className="font-space text-[11px] tracking-[0.3em] uppercase text-muted-foreground">The product</p>
          <h2 id="preview-heading" className="mt-4 max-w-2xl text-balance text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
            A document on one side. A conversation on the other.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <div
            role="img"
            aria-label="Illustrative preview of the TalkDoc interface: a document panel beside a conversation where a question about API rate limits is answered with a reference to page 47."
            className="grid overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 md:grid-cols-[1fr_1.25fr]"
          >
            {/* Document panel */}
            <div className="border-b border-border md:border-b-0 md:border-r">
              <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                <FileText className="size-4 text-amber-signal" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ivory">Q3-Platform-Architecture.pdf</p>
                  <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">142 pages, indexed</p>
                </div>
              </div>
              {/* Faux document body, purely decorative */}
              <div aria-hidden="true" className="space-y-3 p-5 opacity-40">
                <div className="h-2 w-3/4 rounded-full bg-ivory/60" />
                <div className="h-2 w-full rounded-full bg-ivory/40" />
                <div className="h-2 w-5/6 rounded-full bg-ivory/40" />
                <div className="h-2 w-2/3 rounded-full bg-ivory/30" />
                <div className="mt-6 h-2 w-1/2 rounded-full bg-ivory/60" />
                <div className="h-2 w-4/5 rounded-full bg-ivory/40" />
                <div className="rounded-md border border-amber-signal/50 bg-amber-signal/10 p-4">
                  <div className="h-2 w-full rounded-full bg-amber-signal/60" />
                  <div className="mt-2 h-2 w-4/5 rounded-full bg-amber-signal/40" />
                </div>
                <p className="pt-3 font-space text-[10px] tracking-wider text-muted-foreground uppercase">Page 47, section 4.2</p>
              </div>
            </div>

            {/* Conversation panel */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">Conversation</p>
                <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">Grounded answers</p>
              </div>

              <div className="flex flex-1 flex-col gap-5 p-5">
                <div className="max-w-[85%] self-end rounded-lg rounded-br-sm bg-raised px-4 py-3">
                  <p className="text-sm text-ivory">What rate limits apply to the public API, and where are they configured?</p>
                </div>

                <div className="max-w-[90%] space-y-3 self-start">
                  <div className="rounded-lg rounded-bl-sm border border-border bg-background px-4 py-3">
                    <p className="text-sm leading-relaxed text-foreground">
                      The public API allows 120 requests per minute per key, enforced at the gateway. Limits are
                      configured in the deployment settings, with per-tenant overrides available on request.
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 font-space text-[10px] tracking-wider text-muted-foreground uppercase">
                      <CornerDownRight className="size-3 text-amber-signal" aria-hidden="true" />
                      Answer grounded in page 47
                    </p>
                  </div>
                  <p className="flex items-start gap-2 font-space text-[10px] leading-relaxed tracking-wider text-muted-foreground uppercase">
                    <Quote className="mt-0.5 size-3 shrink-0 text-amber-signal" aria-hidden="true" />
                    Sample exchange with illustrative content
                  </p>
                </div>
              </div>

              {/* Composer */}
              <div className="border-t border-border p-4">
                <div className="flex min-h-11 items-center justify-between rounded-md border border-input px-4">
                  <span className="text-sm text-muted-foreground">Ask about this document</span>
                  <span className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">Enter ↵</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
