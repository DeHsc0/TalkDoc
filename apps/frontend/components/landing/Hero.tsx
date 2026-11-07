import { Show, SignUpButton } from "@clerk/nextjs";
import { ArrowDown } from "lucide-react";
import AsciiField from "./AsciiField";

export default function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Atmospheric ASCII field, decorative only */}
      <div aria-hidden="true" className="absolute inset-0">
        <AsciiField
          colors={["#33261a", "#4d3820", "#775428", "#a06f35"]}
          shape="horizon"
          cellSize={14}
          density={0.7}
          glyphOpacity={0.9}
          glow={0.06}
          flicker={0.06}
          softness={0.7}
          scale={1.1}
          flow={0.6}
          speed={0.7}
          gradientOpacity={0.4}
          grain={0.06}
          clickEffect="wave"
          className="h-full w-full"
        />
      </div>

      {/* Readability scrim behind the copy column only */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.16_0.008_70_/_0.75)_0%,oklch(0.16_0.008_70_/_0.55)_40%,transparent_70%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-32 pb-16 md:px-10">
        <p className="font-space text-[11px] tracking-[0.3em] uppercase text-amber-signal">
          Document intelligence
          <span aria-hidden="true" className="mx-3 text-muted-foreground">/</span>
          <span className="text-muted-foreground">RAG pipeline, grounded answers</span>
        </p>

        <h1 className="mt-6 max-w-3xl text-balance font-sans text-5xl leading-[1.05] font-medium tracking-tight text-ivory sm:text-6xl lg:text-7xl">
          Your PDFs have answers.{" "}
          <span className="text-amber-signal">Start asking.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Drop in your documents, ask the questions that matter, and turn pages of
          information into conversations that actually move your work forward.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Show when="signed-out">
            <SignUpButton>
              <button className="min-h-11 rounded-md bg-amber-signal px-6 py-3 font-space text-sm font-bold text-primary-foreground transition-colors hover:bg-amber-signal/90">
                Start with your PDFs
              </button>
            </SignUpButton>
          </Show>
          <a
            href="#preview"
            className="group inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-6 py-3 font-space text-sm text-ivory transition-colors hover:border-amber-signal/50 hover:text-amber-signal"
          >
            See how it works
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-14 font-space text-xs tracking-wider text-muted-foreground">
          <span aria-hidden="true" className="mr-2 inline-block size-1.5 rounded-full bg-amber-signal align-middle" />
          Upload a PDF, and TalkDoc reads every page before you ask.
        </p>
      </div>

      {/* Cliffhanger: preview edge visible below the fold */}
      <div className="pointer-events-none relative z-10 mx-auto hidden w-full max-w-6xl translate-y-8 px-10 opacity-70 md:block">
        <div className="h-24 rounded-t-xl border border-b-0 border-border bg-surface" />
      </div>
    </section>
  );
}
