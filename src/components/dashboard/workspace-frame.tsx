import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function WorkspaceFrame({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  children,
  accent = 'primary',
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  accent?: 'primary' | 'terra' | 'lagoon';
}) {
  const accentClass = {
    primary: 'bg-primary text-primary-foreground shadow-[0_18px_50px_hsl(var(--primary)/0.18)]',
    terra: 'bg-terra text-terra-foreground shadow-[0_18px_50px_hsl(var(--terra)/0.18)]',
    lagoon: 'bg-lagoon text-white shadow-[0_18px_50px_hsl(var(--lagoon)/0.18)]',
  }[accent];

  return (
    <div className="space-y-7 sm:space-y-9">
      <header className="relative overflow-hidden rounded-[1.75rem] border bg-card px-5 py-6 shadow-soft sm:px-8 sm:py-8">
        <div className="lagoon-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-4xl items-start gap-4 sm:gap-5">
            <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl sm:h-14 sm:w-14', accentClass)}>
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="relative shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
