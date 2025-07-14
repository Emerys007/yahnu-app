
"use client"

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useCountry } from '@/context/country-context';

export const Logo = (props: { className?: string }) => {
  const { resolvedTheme } = useTheme();
  const { country } = useCountry();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use a placeholder to prevent hydration mismatch and layout shift
  if (!mounted) {
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }
  
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const src = `/images/Country Maps/${country.theme}-${theme}.svg`;
  
  return (
    <div className={cn(props.className, "transition-opacity duration-300")}>
        <Image 
            key={src} // Add key to force re-render on src change
            src={src} 
            alt={`${country.name.en} map logo`} 
            width={100}
            height={100}
            sizes="100vw"
            className="w-full h-full"
            priority
            unoptimized // Useful for SVGs that Next.js might not optimize well
        />
    </div>
  );
};
