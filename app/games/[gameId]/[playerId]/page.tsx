"use client";

import { useEffect, useState  } from "react";
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Tag, Typography, message, Modal, Alert} from 'antd';
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
  const [messageApi, contextHolder] = message.useMessage();
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
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
            startGame: false
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

    const interval = setInterval(updateGameState, 3000);
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

  // Phase durations in seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const PREP_DURATION = 45;
  const GAME_DURATION = 60;

  useEffect(() => {
    if (!game?.timer) {
      setRemainingSeconds(0);
      return;
    }
    const startTime = Date.parse(game.timer);
    let totalDuration: number;
    if (game.status === 'IN_GAME_PREPARATION') {
      totalDuration = PREP_DURATION;
    } else if (game.status === 'IN_GAME') {
      totalDuration = GAME_DURATION;
    } else {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const secs = Math.max(0, totalDuration - elapsed);
      setRemainingSeconds(secs);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [game?.timer, game?.status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CountdownTimer = () => (
    <div className="game-timer">
      <Text strong>Timer: </Text>
      <Tag color={remainingSeconds === 0 ? "red" : "default"}>
        {formatTime(remainingSeconds)}
      </Tag>
    </div>
  );

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
      }
    ]
  };


  if (!currentLocation) {return <div>Getting your location...</div>;}

  if (!game) {return <div>Loading game data...</div>;}

  if (!apiKey || !isLoaded) {
    return <div>Loading map...</div>;
  }

  const gameCenter = game.centerLatitude && game.centerLongitude
    ? { lat: game.centerLatitude, lng: game.centerLongitude }
    : currentLocation;

  return (
    <div className="game-play-container">
      {contextHolder}
      {game?.status === 'IN_GAME_PREPARATION' && (
          currentPlayer?.role === 'HIDER' ? (
              <Alert
                  banner
                  message="Get into the game area and hide!"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
              />
          ) : (
              <Alert
                  banner
                  message="Prepare for your hunt!"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
              />
          )
      )}
      {game?.status === 'IN_GAME' && (
        currentPlayer?.role === 'HIDER' && currentPlayer.status !== 'FOUND' ? (
          <Alert
            banner
            message="The hunt has begun! The hunter is on the loose."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : currentPlayer?.role === 'HUNTER' ? (
          <Alert
            banner
            message="You can start hunting now!"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : null
      )}
      {currentPlayer?.role === 'HIDER' &&
          currentPlayer.status === 'FOUND' && (
              <Alert
                  banner
                  message="You have been found! Please wait and spectate until the game is over."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
              />
          )}
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
          {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={currentLocation}
                zoom={18}
                options={mapOptions}
                onLoad={(map: google.maps.Map) => {
                  console.log('Map Loaded:', map);
                }}
              >
                <Marker
                  position={currentLocation}
                />
                <Circle
                  key={`circle-${gameCenter.lat}-${gameCenter.lng}-${game.radius}`}
                  center={gameCenter}
                  radius={game.radius}
                  options={{
                    fillColor: "rgba(255, 0, 0, 0.2)",
                    fillOpacity: 0.3,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2
                  }}
                />
              </GoogleMap>
          ) : (
            <div>Loading map...</div>
          )}
        </div>

        <div className="game-play-info">
          <div className="player-status">
            {currentPlayer && (
              <div className="status-item">
                {currentPlayer.outOfArea && (
                  <Tag color="orange">OUT OF AREA, VISIBLE FOR HUNTER</Tag>
                )}
              </div>
            )}

            <div className="status-item">
              <Text strong>Players:</Text>
              <div className="player-avatars">
                {game.players.map(player => {
                  const isMe = player.playerId === currentPlayer?.playerId;
                  return (
                    <div
                      key={player.playerId}
                      className="player-avatar-item"
                      style={{ display: 'inline-block', textAlign: 'center', margin: '0 8px' }}
                    >
                      <Avatar
                        icon={<UserOutlined />}
                        size="small"
                        style={{
                          backgroundColor: player.role === 'HUNTER' ? '#ff4d4f' : '#52c41a',
                          opacity: player.status === 'FOUND' ? 0.1 : 1,
                          display: 'block',
                          margin: '0 auto'
                        }}
                      />
                      <Text
                        style={{
                          marginTop: 4,
                          display: 'block',
                          textDecoration: isMe ? 'underline' : 'none'
                        }}
                      >
                        {player.displayName}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {game?.status === 'IN_GAME' &&
            currentPlayer &&
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