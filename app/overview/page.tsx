"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, List, Tooltip, Typography } from 'antd';
import { UserOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/overview.css";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useAudio } from "@/hooks/useAudio";


interface UserGetDTO {
  userId: number;
  username: string;
  token: string;
  stats: UserStats;
  profilePicture?: string;
}
interface UserStats {
  gamesPlayed: string;
  creation_date: string;
  wins: string;
  points: string;
}
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
   const [user, setUser] = useState<UserGetDTO | null>(null);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [fixedLocation, setFixedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [games, setGames] = useState<GameGetDTO[]>([]);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const { apiKey, isLoaded } = useGoogleMaps();
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);


 useEffect(() => {
    if (!token)
      return;
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<UserGetDTO>("/me", {
          Authorization: `Bearer ${token}`,
        });
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (error instanceof Error) {
          console.error(`Error fetching user data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiService, token, router]);

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
    
  let watchId: number | null = null;
  let intervalId: NodeJS.Timeout;
  let errorCount = 0;

  if (navigator.geolocation) {
    const geolocationOptions = {
      enableHighAccuracy: true,
      maximumAge: 30000,  // Accept cached positions up to 30 seconds old
      timeout: 10000      // More generous timeout for Firefox
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        errorCount = 0; // Reset error counter on success
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Only update if coordinates changed significantly
        if (!currentLocation || 
            Math.abs(newLocation.lat - currentLocation.lat) > 0.0001 || 
            Math.abs(newLocation.lng - currentLocation.lng) > 0.0001) {
          setCurrentLocation(newLocation);
          if (!fixedLocation) {
            setFixedLocation(newLocation);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        errorCount++;
        
        // Only fallback after multiple consecutive errors
        if (errorCount > 2) {
          setCurrentLocation({ lat: 47.374444, lng: 8.541111 });
        }
      },
      geolocationOptions
    );

    // Set up polling with cleanup
    intervalId = setInterval(fetchGames, 5000);
  } else {
    console.log('Geolocation is not supported by this browser.');
    setCurrentLocation({ lat: 47.374444, lng: 8.541111 });
  }

  return () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    clearInterval(intervalId);
  };
}, [token, fixedLocation]);
  
  // handleJoinGame: player can join game and game info is updated.
  const handleJoinGame = async (gameId: number) => {
    playClick();
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

  if (!currentLocation || !fixedLocation || !isLoaded || !apiKey || !user) { 
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
           onClick={() => {
                          playClick();
                          router.push('/newgame');
                        }}
        >
          ➕ Create 
        </Button>

        
        <Tooltip title="Tutorial">
          <Button 
            type="text" 
             icon={
    <span style={{ fontSize: '24px' }}>
      <QuestionCircleOutlined />
    </span>
  }
            shape="circle" 
            size="large"
            onClick={() => {playClick(); router.push('/tutorial/1');}}
            style={{ color: 'rgba(0, 0, 0, 0.65)' }}
          />
        </Tooltip>

        <Tooltip title="Profile">
          <Avatar 
            icon={<UserOutlined />} 
            src={user.profilePicture} 
            size="large" 
            style={{ cursor: 'pointer' }}
            onClick={() =>{playClick(); router.push('/overview/profile');}} 
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
                      onClick={() => {playClick(); handleJoinGame(game.gameId);}}
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