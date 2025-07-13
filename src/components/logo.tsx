"use client"

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export const Logo = (props: { className?: string }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const src = resolvedTheme === 'dark' ? '/images/YahnuLogoDark.svg' : '/images/YahnuLogoLight.svg';

  if (!mounted) {
    // Render a placeholder to prevent layout shift and hydration errors
    return <div className={props.className} style={{ aspectRatio: '1 / 1' }} />;
  }

  return (
    <div className={props.className}>
        <Image 
            src={src} 
            alt="Yahnu Logo" 
            width={100} 
            height={100}
            className="w-full h-full"
            priority
        />
    </div>
  );
};
