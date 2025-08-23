
"use client"

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export const DashboardLogo = (props: { className?: string }) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to avoid layout shifts and hydration errors
    return <div className={cn(props.className)} style={{ aspectRatio: '1 / 1' }} />;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' ? '/images/YahnuLogoDark.svg' : '/images/YahnuLogoLight.svg';

  return (
    <div className={cn(props.className, "transition-opacity duration-300")}>
        <Image 
            key={logoSrc} // Add key to force re-render on src change
            src={logoSrc} 
            alt="Yahnu Logo" 
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
