"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadScript, GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { useRouter, useParams } from 'next/navigation';
import { Avatar, Button, Card, List, Tag, Tooltip, Typography, message, Spin, Progress } from 'antd';
import { UserOutlined, AimOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/game.css";

interface Player {
  playerId: number;
  userId: number;
  username?: string;
  role: 'HUNTER' | 'HIDER';
  status: 'HIDING' | 'HUNTING' | 'FOUND';
  outOfArea: boolean;
  foundTime: string | null;
  locationLat: number | null;
  locationLong: number | null;
  rank?: number;
}

interface Game {
  gameId: number;
  gamename: string;
  status: 'IN_LOBBY' | 'IN_GAME_PREPARATION' | 'IN_GAME' | 'FINISHED';
  centerLatitude: number;
  centerLongitude: number;
  timer: string;
  radius: number;
  players: Player[];
  creatorId: number;
}

const { Title, Text } = Typography;

export default function GameComponent() {
  const params = useParams();
  const gameId = params?.id as string;
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFound, setIsFound] = useState<boolean>(false);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const { value: userId } = useLocalStorage<number | null>("userId", null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const apiService = useApi();

  // fetch game data
  const fetchGame = useCallback(async () => {
    try {
      const gameData = await apiService.get<Game>(`/games/${gameId}`, {
        Authorization: `Bearer ${token}`,
      });
      setGame(gameData);
      
      // this chhecks if game is in preparation and calculate time left
      if (gameData.status === 'IN_GAME_PREPARATION') {
        const timer = new Date(gameData.timer);
        const now = new Date();
        const diff = Math.max(0, 60 - Math.floor((now.getTime() - timer.getTime()) / 1000));
        setTimeLeft(diff);
      }
      
      // check if current player is found
      const currentPlayer = gameData.players.find(p => p.userId === userId);
      if (currentPlayer?.status === 'FOUND') {
        setIsFound(true);
      }
    } catch (error) {
      console.error("Failed to fetch game:", error);
      message.error("Failed to load game data");
    } finally {
      setLoading(false);
    }
  }, [gameId, token, userId]);

  //this should update player location
  const updateLocation = useCallback(async () => {
    if (!currentLocation || !game) return;

    try {
      await apiService.put(`/games/${gameId}`, {
        locationLat: currentLocation.lat,
        locationLong: currentLocation.lng,
        startGame: false
      }); 
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  }, [currentLocation, gameId, token]);

  // Handle found action
  const handleFound = async (playerId: number) => {
    try {
      await apiService.put(`/games/${gameId}/players/${playerId}`, {}, {
        
      });
      message.success("Player marked as found!");
      fetchGame();
    } catch (error) {
      console.error("Failed to mark player as found:", error);
      message.error("Failed to mark player");
    }
  };

  // THE MAP.
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
          : 'https://sopra-fs25-group-26-server.oa.r.appspot.com';
        
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
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: 47.3769, lng: 8.5417 }); // Default to Zurich
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: 47.3769, lng: 8.5417 }); // Default to Zurich
    }
  }, []);

  // Poll game updates
  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 5000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  // Update location periodically
  useEffect(() => {
    const locationInterval = setInterval(updateLocation, 10000);
    return () => clearInterval(locationInterval);
  }, [updateLocation]);

  // Handle preparation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (game?.status === 'IN_GAME_PREPARATION' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            fetchGame(); // Refresh game status when timer ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [game?.status, timeLeft, fetchGame]);

  if (loading || !apiKey) {
    return <Spin size="large" className="game-loading" />;
  }

  if (!game) {
    return <div className="game-error">Game not found</div>;
  }

  const currentPlayer = game.players.find(p => p.userId === userId);
  const isHunter = currentPlayer?.role === 'HUNTER';
  const isCreator = game.creatorId === userId;

  const mapCenter = game.status !== 'IN_LOBBY' 
    ? { lat: game.centerLatitude, lng: game.centerLongitude }
    : currentLocation || { lat: 47.3769, lng: 8.5417 };

  const getPlayerColor = (player: Player) => {
    if (player.status === 'FOUND') return '#ff4d4f'; // red
    return player.role === 'HUNTER' ? '#52c41a' : '#1890ff'; // green for hunter, blue for hider
  };

  const getPlayerIcon = (player: Player) => {
    if (player.status === 'FOUND') return '🚩';
    return player.role === 'HUNTER' ? '🏹' : '👤';
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <Title level={2}>{game.gamename}</Title>
        <Tag color={game.status === 'IN_GAME' ? 'green' : 
                     game.status === 'IN_GAME_PREPARATION' ? 'orange' : 
                     game.status === 'FINISHED' ? 'red' : 'blue'}>
          {game.status.replace('_', ' ')}
        </Tag>
      </div>

      {game.status === 'IN_GAME_PREPARATION' && (
        <div className="game-timer">
          <Progress
            type="circle"
            percent={(timeLeft / 60) * 100}
            format={() => `${timeLeft}s`}
            strokeColor={timeLeft > 10 ? '#52c41a' : '#ff4d4f'}
          />
          <Text strong>Game starts in {timeLeft} seconds</Text>
        </div>
      )}

      {game.status === 'FINISHED' && (
        <Card className="game-results">
          <Title level={3}><TrophyOutlined /> Game Results</Title>
          <List
            dataSource={[...game.players].sort((a, b) => (a.rank || 0) - (b.rank || 0))}
            renderItem={(player) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={`https://i.pravatar.cc/150?u=${player.userId}`} />}
                  title={`${player.username || 'Player'} (${player.role})`}
                  description={`Rank: ${player.rank}`}
                />
                {player.rank === 1 && <Tag color="gold">Winner</Tag>}
              </List.Item>
            )}
          />
          <Button type="primary" onClick={() => router.push('/overview')}>
            Return to Overview
          </Button>
        </Card>
      )}

      <div className="game-map-container">
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '500px' }}
            center={mapCenter}
            zoom={15}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {game.status !== 'IN_LOBBY' && (
              <Circle
                center={mapCenter}
                radius={game.radius}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#FF0000',
                  fillOpacity: 0.2,
                }}
              />
            )}

            {game.players.map((player) => (
              player.locationLat && player.locationLong && (
                <Marker
                  key={player.playerId}
                  position={{ lat: player.locationLat, lng: player.locationLong }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: getPlayerColor(player),
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#ffffff'
                  }}
                  label={getPlayerIcon(player)}
                  onClick={() => setSelectedPlayer(player)}
                />
              )
            ))}

            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#722ed1',
                  fillOpacity: 1,
                  strokeWeight: 1,
                  strokeColor: '#ffffff'
                }}
                label="📍"
              />
            )}

            {selectedPlayer && (
              <InfoWindow
                position={{ 
                  lat: selectedPlayer.locationLat || 0, 
                  lng: selectedPlayer.locationLong || 0 
                }}
                onCloseClick={() => setSelectedPlayer(null)}
              >
                <div>
                  <Text strong>{selectedPlayer.username || 'Player'}</Text>
                  <br />
                  <Text>Role: {selectedPlayer.role}</Text>
                  <br />
                  <Text>Status: {selectedPlayer.status}</Text>
                  {isHunter && selectedPlayer.role === 'HIDER' && selectedPlayer.status === 'HIDING' && (
                    <Button 
                      size="small" 
                      type="primary" 
                      danger
                      onClick={() => handleFound(selectedPlayer.playerId)}
                      style={{ marginTop: '8px' }}
                    >
                      Mark as Found
                    </Button>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="game-players">
        <Title level={4}>Players</Title>
        <List
          dataSource={game.players}
          renderItem={(player) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={`https://i.pravatar.cc/150?u=${player.userId}`} />}
                title={`${player.username || 'Player'} ${player.userId === userId ? '(You)' : ''}`}
                description={
                  <>
                    <Tag color={player.role === 'HUNTER' ? 'green' : 'blue'}>
                      {player.role}
                    </Tag>
                    <Tag color={
                      player.status === 'HIDING' ? 'blue' : 
                      player.status === 'HUNTING' ? 'green' : 'red'
                    }>
                      {player.status}
                    </Tag>
                    {player.rank && <Tag>Rank: {player.rank}</Tag>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {isFound && (
        <div className="game-found-notice">
          <Card className="found-card">
            <Title level={3}>You've been found!</Title>
            <Text>Wait for the game to finish to see the results.</Text>
          </Card>
        </div>
      )}
    </div>
  );
}