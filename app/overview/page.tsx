"use client";

import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [fixedLocation, setFixedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const router = useRouter();

  // the backend URL is not fetched only once.
  const backendUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://sopra-fs25-group-26-server.oa.r.appspot.com';


  useEffect(() => {
    const fetchApiKey = async () => {
      // 1. Try using the direct env variable first (works in Vercel)
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (envKey) {
        setApiKey(envKey);
        return; // Stop here if the key exists
      }

      try{
        const response = await fetch(`${backendUrl}/api/maps/key`);
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      }
    };

    fetchApiKey();
    
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);

          // Only set the fixedLocation once when the location is first fetched
          if (!fixedLocation) setFixedLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 } // Customize options as needed
      );

      // Clean up the watch position when the component unmounts
      return () =>navigator.geolocation.clearWatch(watchId);
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [fixedLocation, backendUrl]); // Only re-run when fixedLocation changes

  const handleCreateGame = async () => {
    if (!fixedLocation) {
      alert("Please wait until your location is determined");
      return;
    }

    const gameName = prompt("Enter a name for your game:");
    if (!gameName?.trim()) return;

    setIsCreatingGame(true);
    try {
      const response = await fetch(`${backendUrl}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("token") || ''
        },
        body: JSON.stringify({
          gamename: gameName,
          locationLat: fixedLocation.lat,
          locationLong: fixedLocation.lng
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create game');
      }
      
      const gameData = await response.json();
      router.push(`/lobby/${gameData.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert(`Game creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  if (!currentLocation || !apiKey || !fixedLocation) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentLocation}
          zoom={16}
          onLoad={(map: google.maps.Map) => {
            console.log('Map Loaded:', map);
            // You can interact with the map instance here if needed
          }}
        >
          <Marker position={currentLocation} />
          {/* Fixed circle with 100 meters radius at the initial location */}
          <Circle
            center={fixedLocation}  // Circle will stay at the fixed location
            radius={100} // 100 meters radius
            options={{
              fillColor: "rgba(0, 123, 255, 0.3)", 
              fillOpacity: 0.3,
              strokeColor: "#007BFF", 
              strokeOpacity: 0.7,
              strokeWeight: 2
            }}
          />
        </GoogleMap>

        {/* Overlay with inline styles */}
        <div style={{
          position: 'absolute',
          top: '20px', // border to top
          left: '40%', // so that location info is roughly in the middle
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          maxWidth: '300px'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.2rem' }}> Your location Info</h2>
          <p style={{ margin: '8px 0', color: '#555' }}>Lat: {currentLocation.lat.toFixed(6)}</p>
          <p style={{ margin: '8px 0', color: '#555' }}>Lng: {currentLocation.lng.toFixed(6)}</p>
          

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              style={buttonStyle('#4285F4')}
              onClick={() => window.location.reload()}
            >
              Refresh Location
            </button>

            <button
              style={buttonStyle('#34A853')}
              onClick={handleCreateGame}
              disabled={isCreatingGame}
            >
              {isCreatingGame ? 'Creating...' : 'Create Game'}
            </button>

            <button
              style={buttonStyle('#FBBC05')}
              onClick={() => router.push('/profile')}
            >
              User Profile
            </button>

            <button
              style={buttonStyle('red', true)}
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </LoadScript>
    </div>
  );
}

const buttonStyle = (color: string, marginTop = false) => ({
  backgroundColor: color,
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginTop: marginTop ? '10px' : '0',
  width: '100%',
  transition: 'opacity 0.2s',
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
});