"use client";

import { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Tag, Typography, message, Modal, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/game-play.css";
import { useParams } from "next/navigation";


interface PlayerGetDTO {
  playerId: number;
  userId: number;
  displayName: string;
  role: 'HUNTER' | 'HIDER';
  status: 'HIDING' | 'HUNTING' | 'FOUND';
  outOfArea: boolean;
  foundTime: string | null;
  locationLat: number | null;
  locationLong: number | null;
  rank: number | null;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string | null;
  radius: number;
  creatorId: number;
  players: PlayerGetDTO[];
}

const { Title, Text } = Typography;

export default function GamePlay() {
  const [messageApi, contextHolder] = message.useMessage();
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [game, setGame] = useState<GameGetDTO | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerGetDTO | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [caughtModalVisible, setCaughtModalVisible] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  const playerId = params?.playerId as string;
  const apiService = useApi();

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
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        messageApi.error("Couldn't get your location. Please enable location services.");
      },
      { enableHighAccuracy: true }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [messageApi]);

  useEffect(() => {
    if (!currentLocation || !token || !gameId || !playerId) return;

    const updateGameState = async () => {
      try {
        const response = await apiService.put<GameGetDTO>(
          `/games/${gameId}`,
          {
            locationLat: currentLocation.lat,
            locationLong: currentLocation.lng,
            startGame: true
          },
          { Authorization: `Bearer ${token}` }
        );
        
        setGame(response);
        
        const player = response.players.find(p => p.playerId === parseInt(playerId));
        if (player) {
          setCurrentPlayer(player);
        } else {
          messageApi.error("Player not found in this game");
          router.push("/overview");
        }

        if (response.status === 'IN_LOBBY') {
          messageApi.info("Game hasn't started yet");
          router.push(`/lobby/${gameId}`);
          return;
        }
        
        if (response.status === 'FINISHED') {
          if (updateInterval) {
            clearInterval(updateInterval);
          }
          router.push(`/games/${gameId}/leaderboard`);
        }
      } catch (error) {
        console.error("Failed to update game state:", error);
        messageApi.error("Failed to update game state");
      }
    };

    updateGameState();
    
    const interval = setInterval(updateGameState, 5000);
    setUpdateInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentLocation, token, gameId, playerId, apiService, router, messageApi]);

  const handleCaughtAction = async () => {
    if (!gameId || !playerId || !token) return;
    
    try {
      setCaughtModalVisible(false);
      
      const response = await apiService.put<GameGetDTO>(
        `/games/${gameId}/players/${playerId}`,
        {},
        { Authorization: `Bearer ${token}` }
      );
      
      setGame(response);
      
      const player = response.players.find(p => p.playerId === parseInt(playerId));
      if (player) {
        setCurrentPlayer(player);
        messageApi.success("You've been marked as caught!");
      }
      
      if (response.status === 'FINISHED') {
        if (updateInterval) {
          clearInterval(updateInterval);
        }
        router.push(`/leaderboard`);
      }
    } catch (error) {
      console.error("Failed to mark player as caught:", error);
      messageApi.error("Failed to mark you as caught");
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'HUNTER' ? 'red' : 'green';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'HUNTING': return 'red';
      case 'HIDING': return 'green';
      case 'FOUND': return 'gray';
      default: return 'blue';
    }
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    styles: [
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  if (!currentLocation || !apiKey || !game) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <Text className="loading-text">Loading game...</Text>
      </div>
    );
  }

  const gameCenter = game.centerLatitude && game.centerLongitude 
    ? { lat: game.centerLatitude, lng: game.centerLongitude } 
    : currentLocation;
  
  return (
    <div className="game-play-container">
      {contextHolder}
      
      <header className="game-play-header">
        <Title level={3} className="game-title">{game.gamename}</Title>
        {currentPlayer && (
          <Tag color={getRoleColor(currentPlayer.role)} className="role-tag">
            {currentPlayer.role}
          </Tag>
        )}
      </header>

      <div className="game-play-content">
        <div className="map-container">
          <LoadScript googleMapsApiKey={apiKey as string}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={17}
              options={mapOptions}
            >
              <Marker 
                position={currentLocation} 
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
              />
              
              <Circle
                center={gameCenter}
                radius={game.radius}
                options={{
                  fillColor: "rgba(0, 123, 255, 0.2)",
                  fillOpacity: 0.3,
                  strokeColor: "#007BFF",
                  strokeOpacity: 0.8,
                  strokeWeight: 2
                }}
              />
            </GoogleMap>
          </LoadScript>
        </div>
        
        <div className="game-play-info">
          <div className="player-status">
            {currentPlayer && (
              <div className="status-item">
                <Text strong>Status:</Text>
                <Tag color={getStatusColor(currentPlayer.status)}>
                  {currentPlayer.status}
                </Tag>
                {currentPlayer.outOfArea && (
                  <Tag color="orange">OUT OF AREA</Tag>
                )}
              </div>
            )}
            
            <div className="status-item">
              <Text strong>Players:</Text>
              <div className="player-avatars">
                {game.players.map(player => (
                  <Tooltip key={player.playerId} title={`${player.displayName} (${player.status})`}>
                    <Avatar 
                      icon={<UserOutlined />} 
                      style={{ 
                        backgroundColor: player.role === 'HUNTER' ? '#ff4d4f' : '#52c41a',
                        opacity: player.status === 'FOUND' ? 0.5 : 1
                      }}
                      size="small"
                    />
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
          
          {currentPlayer && 
           currentPlayer.role === 'HIDER' && 
           currentPlayer.status !== 'FOUND' && (
            <Button 
              danger
              type="primary"
              size="large"
              className="caught-button"
              onClick={() => setCaughtModalVisible(true)}
            >
              I have Been Caught!
            </Button>
          )}
        </div>
      </div>
      
      <Modal
        title="Confirm Caught"
        open={caughtModalVisible}
        onOk={handleCaughtAction}
        onCancel={() => setCaughtModalVisible(false)}
        okText="Yes, I'm caught"
        cancelText="Cancel"
      >
        <p>Are you sure you want to mark yourself as caught? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}