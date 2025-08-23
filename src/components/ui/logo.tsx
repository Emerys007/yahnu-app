
"use client"

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const Logo = (props: { className?: string }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to avoid layout shifts
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }
  
  return (
    <div className={cn(props.className, "transition-opacity duration-300")}>
        <Image 
            src="/images/Country Maps/Ivory Coast.svg"
            alt="Logo Yahnu - Carte de la Côte d'Ivoire" 
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
