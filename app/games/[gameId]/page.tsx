"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { Avatar, Button, List, Tag, Typography, message } from 'antd';
import { UserOutlined, PlayCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/lobby.css";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useAudio } from "@/hooks/useAudio";


interface UserGetDTO {
  userId: number;
  username: string;
  token: string;
  stats: Record<string, string>;
}

interface PlayerGetDTO {
  playerId: number;
  userId: number;
  displayPicture: string;
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
  centerLatitude: number | null;
  centerLongitude: number | null;
  timer: string | null;
  radius: number | null;
  creatorId: number;
  players: PlayerGetDTO[];
}

const { Title, Text } = Typography;

export default function Page() {
  const [messageApi, contextHolder] = message.useMessage();
  const errorHandledRef = useRef(false);

  const [game, setGame] = useState<GameGetDTO | null>(null);
  const[currentUser, setCurrentUser] = useState<UserGetDTO | null>(null);
  const[currentPlayer, setCurrentPlayer] = useState<PlayerGetDTO | null>(null);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [exiting, setExiting] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId;
  const apiService = useApi();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);
  const playExit = useAudio('/sounds/exit.mp3', 0.3);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const user = await apiService.get<UserGetDTO>('/me', {
          Authorization: `Bearer ${token}`
        });
        setCurrentUser(user);
      } catch (e) {
        console.error('Could not load /me', e);
      }
    })();
  }, [token]);

  const fetchGame = async () => {
    if (!currentLocation || !currentUser) {
      return;
    }
    try {
      const gameData = await apiService.put<GameGetDTO>(`/games/${gameId}`,
          {
            locationLat: currentLocation.lat,
            locationLong: currentLocation.lng,
            startGame: false
          },
          {
        Authorization: `Bearer ${token}`,
      });
      setGame(gameData);
      console.log("Fetched game", gameData);
      const me = gameData.players.find(p => p.userId === currentUser!.userId) || null;
      setCurrentPlayer(me);
      // if [playerId] has moved to in preparation, route player
      if (gameData.status === 'IN_GAME_PREPARATION') {
        if (me) {
          router.push(`/games/${gameId}/${me.playerId}`);
        }
        return;
      }
    } catch (error: unknown) {
      if (!errorHandledRef.current) {
        errorHandledRef.current = true;
        messageApi.info("Game no longer exists. Returning to overview...");
        // Delay redirect by 3 seconds to allow the message to display
        setTimeout(() => {
          router.push('/overview');
        }, 3000);
      }
      console.error("Failed to fetch game:", error);
    }
  };

  // this is a guard. to avoid 401 Error, first wait till token is available and then fetch [gameID].
  useEffect(() => {
    if (!token || !gameId || !currentUser || !currentLocation) return; // Wait until token and gameId is available

    fetchGame();
    const interval = setInterval(fetchGame, 1000);

    return () => clearInterval(interval);
  }, [token, gameId, currentUser, currentLocation]); // <-- Depend on token, gameId


  // To get the current location.
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
          setCurrentLocation({ lat: coords.latitude, lng: coords.longitude });
        },
        (err) => {
          console.error("Geolocation error:", err);
        },
        { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleStartGame = async () => {
    if (!currentLocation) {
      console.error("Current location not available");
      return;
    }

    if (!gameId) {
      console.error("GameId is missing");
      return;
    }

    if (!token) {
      console.error("Authentication token missing");
      return;
    }

    setStarting(true);

    try {
      const response = await apiService.put<GameGetDTO>(
        `/games/${gameId}`,
        {
          startGame: true,
          locationLat: currentLocation.lat,
          locationLong: currentLocation.lng,
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      console.log("Game started:", response);

      if (response.status === "IN_GAME_PREPARATION") {
        if (currentPlayer){
          router.push(`/games/${gameId}/${currentPlayer.playerId}`);
        } else {
          console.error("Current Player is not set.");
        }
      } else {
        messageApi.error("Game needs at least two players");
      }
    } catch (error) {
      messageApi.error("Game needs at least two players");
      console.error(error instanceof Error ? error.message : "Failed to start game");
    } finally {
      setStarting(false);
    }
  };

  const handleExitGame = async () => {
    if (!gameId || !currentPlayer) return;
    setExiting(true);
    try {
      await apiService.delete(
          `/games/${gameId}/players/${currentPlayer.playerId}`,
          { Authorization: `Bearer ${token}`});
      router.push('/overview');
    } catch (error) {
      setTimeout(() => router.push('/overview'), 2000);
      console.error(error)
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="game-page">
      {contextHolder}
      <header className="game-header">
        <Title level={3} className="game-title">ManHunt</Title>
      </header>

      <div className="game-content">
        <div className="game-card">
          <div className="game-list-header">
            <Title level={4} className="game-list-title">
              {game? game.gamename : 'Loading Game...'}
            </Title>
          </div>

          {/* Conditional Rendering of start button only for creator */}
          <div className="global-game-actions">
            {game
                && currentPlayer?.playerId === game.creatorId
                && game.status === 'IN_LOBBY' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={starting}
              onClick={() =>{playClick(); handleStartGame();}}
              className="start-game-button"
            >
              Start
            </Button>
              )}
            <Button
      
              icon={<CloseCircleOutlined />}
              style={{ backgroundColor: 'purple', borderColor: 'purple', color:'white' }}
              loading={exiting}
              onClick={ () => {playExit(); handleExitGame();}}
              className="exit-game-button"
            >
              Exit Game
            </Button>
          </div>
          <div className="players-list">
            <List
              dataSource={game?.players}
              renderItem={player => {
                const isMe = currentPlayer?.playerId === player.playerId;
                return (
                  <List.Item key={player.playerId} className="player-item">
                    <div className="player-info">
                      <Avatar
                        src={player.displayPicture || undefined}
                        icon={!player.displayPicture ? <UserOutlined /> : undefined}
                        size="small"
                      />
                      <Text
                        className="player-name"
                        style={isMe ? { textDecoration: 'underline' } : {}}
                      >
                        {player.displayName}
                      </Text>
                      {player.playerId === game?.creatorId && (
                        <Tag color="gold" className="creator-tag">Creator</Tag>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}