"use client";

import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import useLocalStorage from "@/hooks/useLocalStorage";


export default function Page() {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [fixedLocation, setFixedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [backendUrl, setBackendUrl] = useState('');
  const router = useRouter();
  const { set: setToken } = useLocalStorage<string>("token", ""); 

  

  const fetchGames = async () => {
    try {
      const response = await fetch(`${backendUrl}/games`, {
        headers: {
          Authorization: localStorage.getItem("token") || '',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
        const data = await response.json();
      console.log('Response Data:', data); //  for debugging
  
      if (Array.isArray(data)) {
        setAvailableGames(data); //  set available games if it is an array
      } else {
        console.error("Error: Response data is not an array", data);
        setAvailableGames([]); //  to an empty array if the structure is incorrect
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
      setAvailableGames([]); // Set to an empty array on error
    }
  };
  
  

  useEffect(() => {
    const url =
      window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://sopra-fs25-group-26-server.oa.r.appspot.com';
    setBackendUrl(url);
  }, []);

  useEffect(() => {
    const fetchApiKey = async () => {
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (envKey) {
        setApiKey(envKey);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/maps/key`);
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      }
    };

    if (backendUrl) {
      fetchApiKey();
    }
  }, [backendUrl]);

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${backendUrl}/games`, {
          headers: {
            Authorization: localStorage.getItem("token") || ''
          }
        });
        const data = await response.json();
        setAvailableGames(data);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      }
    };

    if (backendUrl) {
      fetchGames();
    }
  }, [backendUrl]);

  // Watch for geolocation changes
  useEffect(() => {
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
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      // Clean up the watch position when the component unmounts
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [fixedLocation]);

  const handleCreateGame = async () => {
    if (!fixedLocation) {
      alert("Please wait until your location is determined");
      return;
    }
  
    setIsCreatingGame(true);
    try {
      // Send request to create game with a default name or no name
      const response = await fetch(`${backendUrl}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("token") || ''
        },
        body: JSON.stringify({
          gamename: "Default Game Name",  // Or provide an empty string or any other logic for naming
          locationLat: fixedLocation.lat,
          locationLong: fixedLocation.lng
        })
      });
  
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create game');
      }
  
      const gameData = await response.json();
      router.push(`/lobbyv2/${gameData.id}`);  // Redirect directly to the created game's lobby
    } catch (error) {
      console.error('Error:', error);
      alert(`Game creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingGame(false);
    }
  };
  

  if (!currentLocation || !apiKey || !fixedLocation) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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

        <div style={{
          position: 'absolute',
          top: '20px',
          left: '40%',
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
            <button style={buttonStyle('#4285F4')} onClick={() => window.location.reload()}>
              Refresh Location
            </button>

            <button
              style={buttonStyle('#34A853')}
              onClick={handleCreateGame}
              disabled={isCreatingGame}
            >
              {isCreatingGame ? 'Creating...' : 'Create Game'}
            </button>

            <button style={buttonStyle('#FBBC05')} onClick={() => router.push('/users/[id]')}>
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

          <div style={{ marginTop: '15px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>Available Games</h3>
            {availableGames.length === 0 ? (
              <p style={{ color: '#777' }}>No games available</p>
            ) : (
              <ul style={{ listStyle: 'none', paddingLeft: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {Array.isArray(availableGames) ? (
                  availableGames.map((game) => (
                    <li key={game.id} style={{ marginBottom: '6px', cursor: 'pointer', color: '#007BFF' }}
                        onClick={() => router.push(`/lobby/${game.id}`)}>
                      🎮 {game.gamename}
                    </li>
                  ))
                ) : (
                  <p>Error: availableGames is not an array</p>
                )}
              </ul>
            )}
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