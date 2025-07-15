
"use client"

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCountry } from '@/context/country-context';
import { useTheme } from 'next-themes';

export const Logo = (props: { className?: string }) => {
  const { country } = useCountry();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to avoid layout shifts
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }
  
  // Use resolvedTheme to handle the 'system' theme preference
  const isDarkMode = resolvedTheme === 'dark';
  const src = isDarkMode ? country.logoUrlDark : country.logoUrlLight;
  
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
            unoptimized // Useful for SVGs that don't need optimization
        />
    </div>
  );
};
