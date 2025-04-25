"use client";

import { useEffect, useState, useRef  } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Tag, Typography, message, Modal, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/game-play.css";
import { useParams } from "next/navigation";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";


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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [fixedLocation, setFixedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [game, setGame] = useState<GameGetDTO | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerGetDTO | null>(null);
  const [caughtModalVisible, setCaughtModalVisible] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  const playerId = params?.playerId as string;
  const apiService = useApi();
  const { apiKey, isLoaded } = useGoogleMaps();
  const [timeLeft, setTimeLeft] = useState<string>("02:00");



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
        router.push(`/games/${gameId}/leaderboard`);
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

  const COUNTDOWN_DURATION = 120; // 2 min in sec

  const CountdownTimer = () => {
    const [remainingTime, setRemainingTime] = useState<number>(COUNTDOWN_DURATION);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number>(0);
  
    // 1. Initialize timer
    useEffect(() => {
      // timer checked in existing localstorage
      const savedEndTime = localStorage.getItem('countdownEndTime');
      const currentTime = Date.now();
  
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime, 10);
        const remaining = Math.max(0, Math.floor((endTime - currentTime) / 1000));
        
        if (remaining > 0) {
          endTimeRef.current = endTime;
          setRemainingTime(remaining);
          return;
        }
      }
  
      // new timer started
      const newEndTime = currentTime + COUNTDOWN_DURATION * 1000;
      endTimeRef.current = newEndTime;
      localStorage.setItem('countdownEndTime', newEndTime.toString());
    }, []);
  
    // countdown logic
    useEffect(() => {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTimeRef.current - now) / 1000));
        
        setRemainingTime(remaining);
  
        if (remaining <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
  
      //only start timer if time remains
      if (remainingTime > 0) {
        timerRef.current = setInterval(updateTimer, 1000);
      }
      updateTimer();
  
      // Cleanup
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [remainingTime]);
  
    // 3. display is formatted 
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  
    // 4. Reset function (optional - recommended from AI)
    const resetTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const newEndTime = Date.now() + COUNTDOWN_DURATION * 1000;
      endTimeRef.current = newEndTime;
      localStorage.setItem('countdownEndTime', newEndTime.toString());
      setRemainingTime(COUNTDOWN_DURATION);
    };
  
    return (
      <div className="game-timer">
        <Text strong>Timer: </Text>
        <Tag color={remainingTime === 0 ? "red" : "default"}>
          {formatTime(remainingTime)}
        </Tag>
        {/* <button onClick={resetTimer} style={{ marginLeft: 8 }}>Reset</button> */}
      </div>
    );
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


  if (!currentLocation) {return <div>Getting your location...</div>;}
  
  if (!game) {return <div>Loading game data...</div>;}

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
        {/*frontend timer implemented here.*/}
         <div className="game-timer">
         <CountdownTimer/>
        </div>
      </header>
      <div className="game-play-content">
        <div className="map-container">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={17}
              options={mapOptions}
              onLoad={(map: google.maps.Map) => {
                console.log('Map Loaded:', map);
              }}
            >
              <Marker 
                position={currentLocation} 
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
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