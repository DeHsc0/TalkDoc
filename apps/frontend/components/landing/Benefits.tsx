import Reveal from "./Reveal";

const benefits = [
  {
    index: "a",
    title: "Talk to your documents",
    body: "Ask in plain language and get direct answers. No query syntax, no keyword guessing, no re-reading the same page three times.",
  },
  {
    index: "b",
    title: "Skip the manual search",
    body: "TalkDoc has already read every page. Relevant passages surface on their own, with the exact page each answer comes from.",
  },
  {
    index: "c",
    title: "Everything stays organized",
    body: "Each document keeps its own conversations, so research threads stay attached to the files they belong to.",
  },
  {
    index: "d",
    title: "Research that feels natural",
    body: "Follow-up questions build on earlier answers, so a long document becomes an open exploration instead of a scroll marathon.",
  },
];

export default function Benefits() {
  return (
    <section id="benefits" aria-labelledby="benefits-heading" className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-28 md:grid-cols-[1fr_1.4fr] md:px-10 md:py-36">
        <Reveal>
          <p className="font-space text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Why TalkDoc</p>
          <h2 id="benefits-heading" className="mt-4 text-balance text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
            Built for reading less and understanding more.
          </h2>
        </Reveal>

        <dl className="space-y-0">
          {benefits.map((benefit, i) => (
            <Reveal key={benefit.index} delay={i * 0.06}>
              <div className="grid grid-cols-[2rem_1fr] gap-x-6 border-t border-border py-8 last:border-b">
                <dt className="font-space text-xs text-amber-signal">
                  ({benefit.index})
                  <span className="sr-only"> {benefit.title}</span>
                </dt>
                <div>
                  <p className="text-lg font-medium tracking-tight text-ivory">{benefit.title}</p>
                  <dd className="mt-2 max-w-xl leading-relaxed text-muted-foreground">{benefit.body}</dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
