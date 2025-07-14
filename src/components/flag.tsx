import { cn } from "@/lib/utils";

type FlagProps = {
  countryCode: string;
  className?: string;
};

// Basic implementation using a service like flagcdn.com
// This can be replaced with a more robust component if needed.
export const Flag = ({ countryCode, className }: FlagProps) => {
  if (!countryCode) return null;

  const src = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${countryCode} flag`}
      className={cn("h-4 w-4 shrink-0", className)}
      // Using a standard img tag for simplicity with external SVGs/PNGs from a CDN
      // to avoid Next.js image optimization configuration for every possible flag CDN.
    />
  );
};
