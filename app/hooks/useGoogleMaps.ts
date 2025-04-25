// hooks/useGoogleMaps.ts
// This provides the API key and loading state to components and coordinates 
// with global loader (utils/googleMapsLoader.ts)
// - fetches API key from backend.
import { useEffect, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

export const useGoogleMaps = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (envKey) return envKey;

      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://sopra-fs25-group-26-server.oa.r.appspot.com';
      
      const response = await fetch(`${backendUrl}/api/maps/key`);
      const data = await response.json();
      return data.apiKey;
    };

    const initialize = async () => {
      try {
        const key = await fetchApiKey();
        if (!key) throw new Error('No API key available');
        
        setApiKey(key);
        await loadGoogleMaps(key);
        setIsLoaded(true);
      } catch (error) {
        console.error('Google Maps initialization failed:', error);
      }
    };

    initialize();
  }, []);

  return { apiKey, isLoaded };
};