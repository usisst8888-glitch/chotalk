'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme-context';

interface BrandedLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function BrandedLogo({ width = 120, height = 120, className = 'rounded-xl' }: BrandedLogoProps) {
  const { distributor, isLoading } = useTheme();

  if (isLoading) {
    return <div style={{ width, height }} className={`bg-neutral-800 animate-pulse ${className}`} />;
  }

  if (distributor?.logo_url) {
    return (
      <Image
        src={distributor.logo_url}
        alt={distributor.site_name}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Chotalk"
      width={width}
      height={height}
      className={className}
    />
  );
}
