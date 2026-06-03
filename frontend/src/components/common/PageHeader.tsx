import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="ops-card ops-gradient rounded-lg p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? <div className="section-title">{eyebrow}</div> : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm text-steel">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
