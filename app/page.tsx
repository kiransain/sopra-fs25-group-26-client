"use client";

import { useApi } from "@/hooks/useApi";  
import { useEffect, useState } from "react";
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

export default function Page() {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const apiService = useApi();  

  useEffect(() => {
    
    const fetchApiKey = async () => {
      try {
        
        const response = await apiService.get<{ apiKey: string }>("/api/maps/key");
        
        if (response && response.apiKey) {
          setApiKey(response.apiKey); 
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      }
    };

    fetchApiKey(); 

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [apiService]);

  if (!currentLocation || !apiKey) {
    return <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      Loading map...
    </div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultZoom={13}
          defaultCenter={currentLocation}
        >
          <Marker position={currentLocation} />
        </Map>

        {/* Overlay with inline styles */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          maxWidth: '300px'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.2rem' }}>Group 26 - Location Info</h2>
          <p style={{ margin: '8px 0', color: '#555' }}>Lat: {currentLocation.lat.toFixed(6)}</p>
          <p style={{ margin: '8px 0', color: '#555' }}>Lng: {currentLocation.lng.toFixed(6)}</p>
          <button 
            style={{
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={() => window.location.reload()}
          >
            Refresh Location
          </button>
        </div>
      </APIProvider>
    </div>
  );
}