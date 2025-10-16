import React, { useEffect, useState } from 'react';
import { AppProvider as PolarisAppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

interface AppBridgeProviderProps {
  children: React.ReactNode;
  apiKey: string;
  shop: string;
}

export function AppBridgeProvider({ children, apiKey, shop }: AppBridgeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Ensure proper App Bridge initialization
    if (typeof window !== 'undefined') {
      // Add any necessary App Bridge configuration here
      console.log('App Bridge initialized for shop:', shop);
    }
  }, [shop]);

  // Don't render Polaris components until after hydration
  if (!mounted) {
    return (
      <div style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '200px'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <PolarisAppProvider
      i18n={enTranslations}
      features={{
        polarisSummerEditions2023: true,
      }}
    >
      {children}
    </PolarisAppProvider>
  );
}
