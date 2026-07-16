import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Yahnu"
      className={cn('shrink-0 overflow-visible', className)}
    >
      <path
        d="M15 16.5 32 27l17-10.5M32 27v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="16.5" r="8" className="fill-terra" />
      <circle cx="49" cy="16.5" r="8" className="fill-lagoon" />
      <circle cx="32" cy="47" r="8" className="fill-primary" />
      <circle cx="15" cy="16.5" r="2.4" className="fill-terra-foreground" />
      <circle cx="49" cy="16.5" r="2.4" className="fill-white" />
      <circle cx="32" cy="47" r="2.4" className="fill-white" />
    </svg>
  );
}
