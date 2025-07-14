
"use client"

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCountry } from '@/context/country-context';

export const Logo = (props: { className?: string }) => {
  const { country } = useCountry();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }
  
  const src = country.logoUrl;
  
  return (
    <div className={cn(props.className, "transition-opacity duration-300")}>
        <Image 
            key={src}
            src={src} 
            alt={`${country.name.en} map logo`} 
            width={100}
            height={100}
            sizes="100vw"
            className="w-full h-full"
            priority
            unoptimized
        />
    </div>
  );
};
