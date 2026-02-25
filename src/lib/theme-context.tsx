'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DistributorInfo {
  id: string;
  site_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface ThemeContextType {
  distributor: DistributorInfo | null;
  isLoading: boolean;
  isDistributorSite: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  distributor: null,
  isLoading: true,
  isDistributorSite: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function DistributorProvider({ children }: { children: ReactNode }) {
  const [distributor, setDistributor] = useState<DistributorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDistributor = async () => {
      try {
        const res = await fetch('/api/distributor');
        if (res.ok) {
          const data = await res.json();
          if (data.distributor) {
            setDistributor(data.distributor);
            // CSS 변수 적용
            document.documentElement.style.setProperty('--color-primary', data.distributor.primary_color);
            document.documentElement.style.setProperty('--color-secondary', data.distributor.secondary_color);
          }
        }
      } catch {
        // 실패 시 기본 테마 유지
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistributor();
  }, []);

  return (
    <ThemeContext.Provider value={{
      distributor,
      isLoading,
      isDistributorSite: !!distributor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
