"use client";

import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, Typography, Tag } from 'antd'; // Added Tag import
import { UserOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/games.css";
import useLocalStorage from "@/hooks/useLocalStorage";

interface PlayerGetDTO {
  playerId: number;
  userId: number;
  role: 'HUNTER' | 'HIDER';
  status: 'HIDING' | 'HUNTING' | 'FOUND';
  outOfArea: boolean;
  foundTime: string;
  locationLat: number | null;
  locationLong: number | null;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string;
  radius: number;
  creatorId: number;
  players: PlayerGetDTO[];
}

const { Title } = Typography;

export default function Page({ params }: { params: { id: string } }) {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [game, setGame] = useState<GameGetDTO | null>(null);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const router = useRouter();
  const apiService = useApi();

  const fetchGame = async () => {
    try {
      const gameData = await apiService.get<GameGetDTO>(`/games/${params.id}`, {
        Authorization: `Bearer ${token}`,
      });
      setGame(gameData);
    } catch (error) {
      console.error("Failed to fetch game:", error);
      router.push('/games');
    }
  };

  useEffect(() => {
    const fetchApiKey = async () => {
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

    fetchApiKey();
    fetchGame();
    
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.log('Geolocation not supported');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [params.id]);

  if (!currentLocation || !apiKey || !game) {
    return <div className="loading-container">Loading game...</div>;
  }

  return (
    <div className="overview-container">
      <header className="header">
        <Title level={3}>{game.gamename}</Title>
        <Avatar 
          icon={<UserOutlined />} 
          size="large" 
          style={{ cursor: 'pointer' }}
          onClick={() => router.push('/users/me')} 
        />
      </header>

      <div className="content-container">
        <div className="map-container">
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={18}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                styles: [
                  {
                    featureType: "poi",
                    stylers: [{ visibility: "off" }]
                  }
                ]
              }}
            >
              <Marker position={currentLocation} />
              
              {game && (
                <Circle
                  center={{
                    lat: game.centerLatitude,
                    lng: game.centerLongitude
                  }}
                  radius={game.radius}
                  options={{
                    fillColor: "rgba(0, 123, 255, 0.3)",
                    fillOpacity: 0.3,
                    strokeColor: "#007BFF",
                    strokeOpacity: 0.7,
                    strokeWeight: 2
                  }}
                />
              )}

              {game?.players.map(player => (
                player.locationLat && player.locationLong && (
                  <Marker 
                    key={player.playerId}
                    position={{ 
                      lat: player.locationLat, 
                      lng: player.locationLong 
                    }}
                    icon={{
                      url: player.role === 'HUNTER' 
                        ? '/hunter-icon.png' 
                        : '/hider-icon.png',
                      scaledSize: new google.maps.Size(32, 32)
                    }}
                  />
                )
              ))}
            </GoogleMap>
          </LoadScript>
        </div>

        <div className="game-panel">
          <Card title="Game Info" className="game-card">
            <p>Status: <Tag color={game.status === 'IN_GAME' ? 'green' : 'blue'}>{game.status}</Tag></p>
            <p>Players: {game.players.length}</p>
            <p>Radius: {game.radius}m</p>
            
            <Button 
              type="primary" 
              danger
              block
              onClick={() => router.push('/games')}
            >
              Leave Game
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}