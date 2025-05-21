"use client";

import { useEffect, useState, useRef  } from "react";
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Tag, Typography, message, Modal, Alert, Progress} from 'antd';
import { UserOutlined, SoundOutlined, SoundFilled, AimOutlined, EyeOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/game-play.css";
import { useParams } from "next/navigation";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useAudio } from "@/hooks/useAudio";
import { motion } from "framer-motion";


interface PlayerGetDTO {
  playerId: number;
  userId: number;
  displayName: string;
  displayPicture : string;
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
  preparationTimeInSeconds: number;
  gameTimeInSeconds: number;
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
  const [powerUpUsed, setPowerUpUsed] = useState(false);
  const [hunterPowerUpUsed, setHunterPowerUpUsed] = useState(false);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [outOfAreaTimer, setOutOfAreaTimer] = useState<number | null>(null);
  const [outOfAreaModalVisible, setOutOfAreaModalVisible] = useState(false);
  const [outOfAreaTimerId, setOutOfAreaTimerId] = useState<NodeJS.Timeout | null>(null);
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);
  const playPowerUp = useAudio('/sounds/powerup.mp3', 0.3);
  const playPowerUp2 = useAudio('/sounds/powerup2.mp3', 0.3);
  const playExit = useAudio('/sounds/exit.mp3', 0.3);
  const playOutOfArea = useAudio('/sounds/longPowerup.mp3', 0.3);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume] = useState(0.1);
  const [isRecenteringArea, setIsRecenteringArea] = useState(false);
  // Timer state
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);



  const activateShowPlayersPowerUp = () => {
    if (powerUpUsed) {
      messageApi.warning("You've already used your power-up!");
      return;
    }
    
    setPowerUpUsed(true);
    setShowAllPlayers(true);
    
    //players will be showed for 10s
    setTimeout(() => {
      setShowAllPlayers(false);
    }, 10000);
  };

  // Hunter's power-up to recenter the game area
  const activateRecenterAreaPowerUp = async () => {
    if (hunterPowerUpUsed || !currentLocation || !gameId || !token) {
      messageApi.warning("You've already used your power-up!");
      return;
    }

    try {
      setIsRecenteringArea(true);
      // Call the API to recenter the game area
      const response = await apiService.put<GameGetDTO>(
        `/games/${gameId}/center`,
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        },
        { Authorization: `Bearer ${token}` }
      );

      setHunterPowerUpUsed(true);
      setGame(response);
      messageApi.success("Game area recentered to your location!");
    } catch (error) {
      console.error("Failed to recenter game area:", error);
      messageApi.error("Failed to use power-up");
    } finally {
      setIsRecenteringArea(false);
    }
  };

  useEffect(() => {
  // Initialize audio element
  audioRef.current = new Audio('/sounds/pulse.mp3');
  audioRef.current.loop = true;
  audioRef.current.volume = volume; // Set initial volume
  
  return () => {
    // Cleanup on unmount
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);


useEffect(() => {
  if (outOfAreaModalVisible) {
    playOutOfArea(); // Play sound when modal opens
  }
}, [outOfAreaModalVisible]);


useEffect(() => {
  if (!audioRef.current) return;

  // Update volume whenever it changes
  audioRef.current.volume = isMuted ? 0 : volume; // Mute sets volume to 0

  // Play/pause based on game status
  if (game?.status === 'IN_GAME' || game?.status === 'IN_GAME_PREPARATION') {
    audioRef.current.play().catch(e => console.log("Audio play failed:", e));
  } else {
    audioRef.current.pause();
  }
}, [game?.status, isMuted, volume]);


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

   // Function to handle when a player is caught after being out of area
   const handleOutOfAreaCaught = async () => {
    if (!gameId || !playerId || !token) return;

    try {
      await apiService.put<GameGetDTO>(
        `/games/${gameId}/players/${playerId}`,
        {},
        { Authorization: `Bearer ${token}` }
      );

      messageApi.error("You have lost for staying out of the game area!");
      setOutOfAreaModalVisible(false);
      
      // Refresh game state
      const response = await apiService.put<GameGetDTO>(
        `/games/${gameId}`,
        {
          locationLat: currentLocation?.lat,
          locationLong: currentLocation?.lng,
          startGame: false
        },
        { Authorization: `Bearer ${token}` }
      );
      
      setGame(response);
      
      const player = response.players.find(p => p.playerId === parseInt(playerId));
      if (player) {
        setCurrentPlayer(player);
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

  
  useEffect(() => {
    
    if (!currentPlayer || 
        currentPlayer.status === 'FOUND' || 
        (game && game.status !== 'IN_GAME')) {
      
      if (outOfAreaTimerId) {
        clearInterval(outOfAreaTimerId);
        setOutOfAreaTimerId(null);
      }
      if (outOfAreaTimer !== null) {
        setOutOfAreaTimer(null);
      }
      if (outOfAreaModalVisible) {
        setOutOfAreaModalVisible(false);
      }
      return;
    }

    
    if (currentPlayer.outOfArea) {
      if (outOfAreaTimer === null) {
        setOutOfAreaTimer(10);
        setOutOfAreaModalVisible(true);
        
        
        const timerId = setInterval(() => {
          setOutOfAreaTimer(prevTime => {
            if (prevTime === null) return null;
            if (prevTime <= 1) {
              clearInterval(timerId);
              handleOutOfAreaCaught();
              return null;
            }
            return prevTime - 1;
          });
        }, 1000);
        
        setOutOfAreaTimerId(timerId);
      }
    } else {
     
      if (outOfAreaTimerId) {
        clearInterval(outOfAreaTimerId);
        setOutOfAreaTimerId(null);
      }
      if (outOfAreaTimer !== null) {
        setOutOfAreaTimer(null);
      }
      if (outOfAreaModalVisible) {
        setOutOfAreaModalVisible(false);
      }
    }
    
    return () => {
      if (outOfAreaTimerId) {
        clearInterval(outOfAreaTimerId);
      }
    };
  }, [currentPlayer?.outOfArea, game?.status, currentPlayer?.role, currentPlayer?.status]);


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

    const interval = setInterval(updateGameState, 1000);
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
  // const PREP_DURATION = get preparationTimeInSeconds;
  // const GAME_DURATION = get gameTimeInSeconds;

  useEffect(() => {
    if (!game) return;

    // When game status changes to preparation or in-game, initialize timer
    if (game.status === 'IN_GAME_PREPARATION' || game.status === 'IN_GAME') {
      const duration = game.status === 'IN_GAME_PREPARATION' 
        ? game.preparationTimeInSeconds 
        : game.gameTimeInSeconds;

      // Only reset timer if this is a new phase (prevention of reset on polling)
      if (initialDuration !== duration) {
        setTimerStartTime(Date.now());
        setInitialDuration(duration);
        setRemainingSeconds(duration);
      }
    }
  }, [game?.status, game?.preparationTimeInSeconds, game?.gameTimeInSeconds]);

  useEffect(() => {
    if (!timerStartTime || !initialDuration) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
      const newRemaining = Math.max(0, initialDuration - elapsedSeconds);
      setRemainingSeconds(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

  return () => clearInterval(interval);
  }, [timerStartTime, initialDuration]);

  const CountdownTimer = () => {
    if (!game || remainingSeconds === null) return null;

    return (
      <div className="game-timer">
        <Text strong>
          {game.status === 'IN_GAME_PREPARATION' ? 'Prep Time: ' : 'Game Time: '}
        </Text>
        <Tag color={
          remainingSeconds <= 10 ? 'red' : 
          remainingSeconds <= 30 ? 'orange' : 'green'
        }>
          {remainingSeconds}
        </Tag>
      </div>
    );
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
        <div>
          <Button 
            shape="circle" 
            icon={isMuted ? <SoundOutlined /> : <SoundFilled />} 
            onClick={() => {
              setIsMuted(!isMuted);
              playClick();
            }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000
            }}
          />
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
                  animation={google.maps.Animation.DROP} 
                />
                <Circle
                  key={`circle-${gameCenter.lat}-${gameCenter.lng}-${game.radius}`}
                  center={gameCenter}
                  radius={game.radius}
                  options={{
                    fillColor: "rgba(102, 0, 255, 0.2)",
                    fillOpacity: 0.3,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2
                  }}
                />
                {showAllPlayers && game.players.map(player => {
                if (!player.locationLat || !player.locationLong || player.playerId === currentPlayer?.playerId) {
                  return null;
                }
                
                return (
                  <Marker
                    key={`player-${player.playerId}`}
                    position={{ lat: player.locationLat, lng: player.locationLong }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 7,
                      fillColor: player.role === 'HUNTER' ? '#ff4d4f' : '#52c41a',
                      fillOpacity: 1,
                      strokeWeight: 0
                    }}
                  />
                );
              })}
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
                  <Tag color="orange">OUT OF AREA</Tag>
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
                        src={player.displayPicture || undefined}
                        icon={!player.displayPicture ? <UserOutlined /> : undefined}
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
          
          

          {/* Power-up buttons */}
          <div className="power-up-buttons-container">
            {game?.status === 'IN_GAME' &&
            currentPlayer &&
           currentPlayer.role === 'HIDER' && 
           currentPlayer.status !== 'FOUND' && (
            <Button 
              danger
              type="primary"
              size="large"
              className="caught-button"
              onClick={() => {playExit(); setCaughtModalVisible(true)}}
            >
              I have Been Caught!
            </Button>
          )}
            {game?.status === 'IN_GAME' && !powerUpUsed && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button 
                  type="primary"
                  shape="circle"
                  className="power-up-button reveal-players-button"
                  onClick={() => {playPowerUp(); activateShowPlayersPowerUp();}}
                  icon={<EyeOutlined />}
                >
                  Reveal
                </Button>
              </motion.div>
            )}


            {/* Hunter-specific power-up button */}
            {game?.status === 'IN_GAME' && 
              currentPlayer?.role === 'HUNTER' && 
              !hunterPowerUpUsed && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button 
                  type="primary"
                  shape="circle"
                  className="power-up-button recenter-area-button"
                  icon={<AimOutlined />}
                  loading={isRecenteringArea}
                  onClick={() => {playPowerUp2(); activateRecenterAreaPowerUp();}}
                >
                  Recenter
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <Modal
        title="Confirm Caught"
        open={caughtModalVisible}
        onOk={() => { playClick(); handleCaughtAction(); }}
        onCancel={() => {playExit(); setCaughtModalVisible(false)}}
        okText="Yes, I'm caught"
        cancelText="Cancel"
      >
        <p>This action cannot be undone.</p>
      </Modal>
      <Modal
  title="You are outside the game area!"
  open={outOfAreaModalVisible}
  footer={null}
  closable={false}
  maskClosable={false}
  style={{ top: 20 }}
>
  <Alert
    message="Return to the game area or you will lose!"
    type="error"
    showIcon
    style={{ marginBottom: 16 }}
  />
  
  {outOfAreaTimer !== null && (
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
        Time remaining: {outOfAreaTimer} seconds
      </Text>
      <Progress 
        percent={(outOfAreaTimer / 10) * 100} 
        status="exception" 
        showInfo={false} 
        strokeColor="#ff4d4f"
      />
    </div>
  )}
  
  <p style={{ textAlign: 'center' }}>
    Return to the game area on the map to continue playing.
  </p>
</Modal>
    </div>
  );
}