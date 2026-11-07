import { Show, SignUpButton } from "@clerk/nextjs";
import AsciiField from "./AsciiField";
import Reveal from "./Reveal";

export default function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="relative overflow-hidden border-t border-border">
      {/* Faint atmospheric echo of the hero */}
      <div aria-hidden="true" className="absolute inset-0 opacity-40">
        <AsciiField
          colors={["#241a10", "#33240f", "#4a3116", "#6b4a20"]}
          shape="horizon"
          cellSize={16}
          density={0.6}
          glyphOpacity={0.8}
          glow={0.06}
          flicker={0.05}
          softness={0.8}
          scale={1.2}
          flow={0.5}
          speed={0.5}
          gradientOpacity={0.3}
          grain={0.05}
          clickEffect="none"
          mouseInteraction={false}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-32 text-center md:px-10 md:py-44">
        <Reveal>
          <h2 id="final-cta-heading" className="max-w-2xl text-balance text-3xl font-medium tracking-tight text-ivory sm:text-4xl md:text-5xl">
            Your next document is already full of answers.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Show when="signed-out">
            <SignUpButton>
              <button className="mt-10 min-h-11 rounded-md bg-amber-signal px-8 py-3.5 font-space text-sm font-bold text-primary-foreground transition-colors hover:bg-amber-signal/90">
                Start with your PDFs
              </button>
            </SignUpButton>
          </Show>
          <p className="mt-6 font-space text-xs tracking-wider text-muted-foreground">
            Free to start. Upload your first PDF and ask it something.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
