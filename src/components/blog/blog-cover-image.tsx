'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type BlogCoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
};

export function BlogCoverImage({ src, alt, className, imageClassName, eager = false }: BlogCoverImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-muted', className)}>
      {src && !failed ? (
        // Media can be a migrated Firebase HTTPS URL or a same-origin Render asset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn('h-full w-full object-cover', imageClassName)}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-32 w-full items-center justify-center" aria-hidden="true">
          <ImageIcon className="h-10 w-10 text-primary/35" />
        </div>
      )}
    </div>
  );
}

