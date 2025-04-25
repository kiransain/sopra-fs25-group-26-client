"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, List, Tooltip, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/overview.css";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";


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
  displayName: string | null;
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
  const [games, setGames] = useState<GameGetDTO[]>([]);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const { apiKey, isLoaded } = useGoogleMaps();



  useEffect(() => {
    if (!token) return;

    const fetchGames = async () => {
      try {
        const gamesData = await apiService.get<GameGetDTO[]>('/games', {
          Authorization: `Bearer ${token}`});
        setGames(gamesData);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

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

      
      const interval = setInterval(fetchGames, 5000);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(interval);
      };
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: -33.860664, lng: 151.208138 });
    }
  }, [fixedLocation, token]);
  
  // handleJoinGame: player can join game and game info is updated.
  const handleJoinGame = async (gameId: number) => {
    try {
      if (!currentLocation) {
        console.error("Current location not available");
        return;
      }
  
      // PUT request to update/add the player to the game
      const response = await apiService.put<GameGetDTO>(
        `/games/${gameId}`,
        {
          locationLat: currentLocation.lat,
          locationLong: currentLocation.lng,
          startGame: false // just joining not starting the game
        },
        {Authorization: `Bearer ${token}`});
      console.log("Joined game:", response);
      //successful -> navigate to the game page
      router.push(`/games/${gameId}`);
    } catch (error) {
      console.error("Failed to join game:", error);
    }
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

  if (!currentLocation || !fixedLocation) { 
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
        <div className="map-container">
          {/* Remove LoadScript since we're handling it globally */}
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
          </GoogleMap>
        </div>

        {}
        <div className="games-list-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Title level={4} style={{ margin: 0 }}>Games</Title>
          </div>

          <List
            dataSource={games}
            loading={loading}
            renderItem={(game) => {
              const creator = game.players.find(p => p.playerId === game.creatorId);
              return (
              <Card className="game-card" size="small">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{game.gamename}</div>
                    <div>
                      <Text type="secondary">
                        {game.players.length} / 5
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        Created by {creator ? creator.displayName : `Player ${game.creatorId}`}
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
            )}}
            locale={{ emptyText: 'No joinable games' }}
          />
        </div>
      </div>
    </div>
  );
}