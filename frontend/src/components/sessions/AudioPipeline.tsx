import { Fragment } from "react";
import { ArrowRight, Headphones, Mic, RadioTower, Server } from "lucide-react";

const steps = [
  { label: "Browser", icon: Mic },
  { label: "Gateway", icon: Server },
  { label: "OpenAI Realtime", icon: RadioTower },
  { label: "Playback", icon: Headphones }
];

export function AudioPipeline({ latencyMs }: { latencyMs?: number | null }) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Audio pipeline</h2>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs text-cyan">
          {typeof latencyMs === "number" && latencyMs > 0 ? `${latencyMs}ms observed` : "latency pending"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Fragment key={step.label}>
              <div className="rounded border border-line bg-panel/80 p-4">
                <Icon size={18} className="text-cyan" />
                <div className="mt-3 text-sm font-semibold text-ink">{step.label}</div>
                <div className="mt-1 text-xs text-steel">{index === 0 ? "pcm16 frames" : index === 1 ? "validated relay" : index === 2 ? "provider events" : "audio queue"}</div>
              </div>
              {index < steps.length - 1 ? <ArrowRight className="hidden self-center text-steel md:block" size={18} /> : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
