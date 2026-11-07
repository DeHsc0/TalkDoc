import Reveal from "./Reveal";
import { FileUp, ScanSearch, MessagesSquare } from "lucide-react";

const steps = [
  {
    index: "01",
    icon: FileUp,
    title: "Upload your PDF",
    body: "Drop a contract, a research paper, or a hundred-page report. TalkDoc accepts the file and takes it from there.",
  },
  {
    index: "02",
    icon: ScanSearch,
    title: "Let TalkDoc process it",
    body: "Every page is read, split, and indexed into a searchable knowledge base built around your document.",
  },
  {
    index: "03",
    icon: MessagesSquare,
    title: "Ask, and explore",
    body: "Question it in plain language. Answers come back grounded in the exact passages that support them.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="relative border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-28 md:px-10 md:py-36">
        <Reveal>
          <p className="font-space text-[11px] tracking-[0.3em] uppercase text-muted-foreground">How it works</p>
          <h2 id="how-it-works-heading" className="mt-4 max-w-2xl text-balance text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
            Three steps between a static PDF and a working conversation.
          </h2>
        </Reveal>

        <ol className="mt-16 space-y-0">
          {steps.map((step, i) => (
            <Reveal key={step.index} delay={i * 0.08}>
              <li className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-3 border-t border-border py-10 sm:gap-x-10 md:grid-cols-[5rem_auto_1fr]">
                <span className="font-space text-sm text-amber-signal md:pt-1.5">{step.index}</span>
                <span className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors group-hover:border-amber-signal/40 group-hover:text-amber-signal md:mt-1">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-xl font-medium tracking-tight text-ivory">{step.title}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
