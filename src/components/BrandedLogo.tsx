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

  // 총판이지만 로고가 없으면 아무것도 표시하지 않음
  if (distributor) {
    return null;
  }

  // 본사 기본 로고
  return (
    <Image
      src="/logo.png"
      alt="스타트봇"
      width={width}
      height={height}
      className={className}
    />
  );
}
