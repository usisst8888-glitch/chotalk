'use client';

import { useTheme } from '@/lib/theme-context';

interface BrandedLogoProps {
  className?: string;
}

export default function BrandedLogo({ className = 'h-12' }: BrandedLogoProps) {
  const { distributor, isLoading } = useTheme();

  if (isLoading) {
    return <div className={`bg-neutral-800 animate-pulse rounded-xl ${className}`} />;
  }

  if (distributor?.logo_url) {
    return (
      <img
        src={distributor.logo_url}
        alt={distributor.site_name}
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
    <img
      src="/logo.png"
      alt="스타트봇"
      className={className}
    />
  );
}
