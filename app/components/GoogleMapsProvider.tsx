'use client';

import { LoadScript } from '@react-google-maps/api';
import { ReactNode, useState, useEffect } from 'react';

export default function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Fetch your API key (same logic you're currently using)
    const fetchKey = async () => {
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (envKey) {
        setApiKey(envKey);
        return;
      }
      
      try {
        const backendUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8080' 
          : 'https://your-production-url.com';
        const response = await fetch(`${backendUrl}/api/maps/key`);
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      }
    };

    fetchKey();
  }, []);

  if (!apiKey) return null;

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      {children}
    </LoadScript>
  );
}