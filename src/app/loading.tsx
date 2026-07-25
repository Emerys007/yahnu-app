import { Logo } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-ivory px-6 dark:bg-background" role="status" aria-live="polite">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto h-14 w-14 text-foreground" />
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-primary/10">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Yahnu prépare votre espace…</p>
      </div>
    </div>
  );
}
