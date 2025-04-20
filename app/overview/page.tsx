"use client";

import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, List, Tag, Tooltip, Typography } from 'antd';
import { UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/overview.css";
import useLocalStorage from "@/hooks/useLocalStorage";

// Game related interfaces matching the backend DTOs
interface PlayerGetDTO {
  playerId: number;
  userId: number;
  role: 'HUNTER' | 'HIDER'; // PlayerRole enum
  status: 'HIDING' | 'HUNTING' | 'FOUND'; // PlayerStatus enum
  outOfArea: boolean;
  foundTime: string; // LocalDateTime as string
  locationLat: number | null;
  locationLong: number | null;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string; // LocalDateTime as string
  radius: number;
  creatorId: number;
  players: PlayerGetDTO[];
}

const { Title, Text } = Typography;

export default function Page() {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [fixedLocation, setFixedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [games, setGames] = useState<GameGetDTO[]>([]);
  const { value: token } = useLocalStorage<string | null>("token", null);

  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();

  // Fetch games from the API
  const fetchGames = async () => {
    try {
      const gamesData = await apiService.get<GameGetDTO[]>('/games', {
        Authorization: `Bearer ${token}`,
      });
      setGames(gamesData);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch Google Maps API key
    const fetchApiKey = async () => {
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (envKey) {
        setApiKey(envKey);
        return;
      }

      try {
        const backendUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8080' 
          : 'https://sopra-fs25-group-26-server.oa.r.appspot.com';
        
        const response = await fetch(`${backendUrl}/api/maps/key`);
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      }
    };

    fetchApiKey();
    fetchGames();
    
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);

          if (!fixedLocation) {
            setFixedLocation(newLocation);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      
      const interval = setInterval(fetchGames, 10000);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(interval);
      };
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [fixedLocation]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'IN_LOBBY': return 'blue';
      case 'IN_GAME': return 'green';
      case 'FINISHED': return 'gray';
      default: return 'default';
    }
  };
  
  const handleJoinGame = (gameId: number) => {
    
    router.push(`/games/${gameId}`);
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    styles: [
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "road",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "administrative",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  if (!currentLocation || !apiKey || !fixedLocation) { 
    return (
      <div className="loading-container">
        Loading map...
      </div>
    );
  }

  return (
    <div className="overview-container">
      {}
      <header className="header">
        <Title level={3} className="app-title">ManHunt</Title>
        
        {}
        <Button
          type="primary"
          size="large"
          className="create-game-button"
          onClick={() => router.push('/newgame')}
        >
          Create Game
        </Button>

        <Tooltip title="Profile">
          <Avatar 
            icon={<UserOutlined />} 
            size="large" 
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/overview/profile')} 
          />
        </Tooltip>
      </header>

      <div className="content-container">
        {}
        <div className="map-container">
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={18}
              options={mapOptions}
              onLoad={(map: google.maps.Map) => {
                console.log('Map Loaded:', map);
              }}
            >
              <Marker position={currentLocation} />
              
              <Circle
                center={fixedLocation}
                radius={100}
                options={{
                  fillColor: "rgba(0, 123, 255, 0.3)", 
                  fillOpacity: 0.3,
                  strokeColor: "#007BFF", 
                  strokeOpacity: 0.7,
                  strokeWeight: 2
                }}
              />
            </GoogleMap>
          </LoadScript>
        </div>

        {}
        <div className="games-list-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Title level={4} style={{ margin: 0 }}>Games</Title>
          </div>

          <List
            dataSource={games}
            loading={loading}
            renderItem={(game) => (
              <Card className="game-card" size="small">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{game.gamename}</div>
                    <div>
                      <Tag color={getStatusColor(game.status)} className="game-status-tag">
                        {game.status}
                      </Tag>
                      <Text type="secondary">
                        {game.players.length} players
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        Radius: {game.radius}m
                      </Text>
                    </div>
                  </div>
                  
                  {game.status === 'IN_LOBBY' && (
                    <Button 
                      type="primary" 
                      size="middle" 
                      className="join-button"
                      onClick={() => handleJoinGame(game.gameId)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </Card>
            )}
            locale={{ emptyText: 'No active games found' }}
          />
        </div>
      </div>
    </div>
  );
}