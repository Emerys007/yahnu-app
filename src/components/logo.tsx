
"use client"

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export const Logo = (props: { className?: string }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use a placeholder to prevent hydration mismatch and layout shift
  if (!mounted) {
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }
  
  const src = resolvedTheme === 'dark' ? '/images/YahnuLogoDark.svg' : '/images/YahnuLogoLight.svg';

  return (
    <div className={cn(props.className, "transition-opacity duration-300")}>
        <Image 
            src={src} 
            alt="Yahnu Logo" 
            width={100}
            height={100}
            sizes="100vw"
            className="w-full h-full"
            priority
        />
    </div>
  );
};
