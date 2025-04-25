"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { Avatar, Button, List, Tag, Typography, message } from 'antd';
import { UserOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/lobby.css";
import useLocalStorage from "@/hooks/useLocalStorage";


interface UserGetDTO {
  userId: number;
  username: string;
  token: string;
  stats: Record<string, string>;
}

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
  centerLatitude: number | null;
  centerLongitude: number | null;
  timer: string | null;
  radius: number | null;
  creatorId: number;
  players: PlayerGetDTO[];
}

interface ApiError {
  response?: {
    status?: number;
  }
}

const { Title, Text } = Typography;

export default function Page() {

  const [game, setGame] = useState<GameGetDTO | null>(null);
  const[currentUser, setCurrentUser] = useState<UserGetDTO | null>(null);
  // Derive currentPlayer from game and currentUser
  const currentPlayer = game
    ? game.players.find(p => p.userId === currentUser?.userId) ?? null
    : null;

  // Sort players by rank for the leaderboard
  const sortedPlayers = game
    ? [...game.players].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
    : [];

  const { value: token } = useLocalStorage<string | null>("token", null);
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId;
  const apiService = useApi();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize message API for notifications
  const [messageApi, contextHolder] = message.useMessage();

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
        messageApi.error('Failed to load user data'); 
      }
    })();
  }, [token, apiService, messageApi]);

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
    } catch (error: unknown) {
      if ((error as ApiError).response?.status === 404) {
        router.push('/overview')
      } else {
        console.error("Failed to fetch [playerId]:", error);
      }
    }
  };

  // this is a guard. to avoid 401 Error, first wait till token is available and then fetch [gameID].
  useEffect(() => {
    if (!token || !gameId || !currentUser || !currentLocation) return; // Wait until token and gameId is available
    fetchGame();
    const interval = setInterval(fetchGame, 10000);

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

  // Navigate back to overview when exiting
  const handleExitGame = () => {
    router.push('/overview');
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
              <Title
                level={4}
                className="game-list-title"
                style={{ display: 'inline-block', marginRight: 16 }}
              >
                {game ? game.gamename : 'Loading Game...'}
              </Title>
              <Title
                level={4}
                className="leaderboard-title"
                style={{ display: 'inline-block' }}
              >
                Leaderboard
              </Title>
            </div>
            <div className="global-game-actions">
              <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleExitGame}
                  className="exit-game-button"
              >
                Exit Game
              </Button>
            </div>
            {/* Show win/lose message for current player */}
            {game && currentPlayer && (
              <div className="game-result-message">
                {currentPlayer.rank === 1 ? (
                  <Text type="success" strong>You have won!</Text>
                ) : (
                  <Text type="danger">You have lost.</Text>
                )}
              </div>
            )}
            <div className="players-list">
              <List
                  dataSource={sortedPlayers}
                  renderItem={player => {
                    const isMe = currentPlayer?.playerId === player.playerId;
                    return (
                        <List.Item key={player.playerId} className="player-item">
                          <div className="player-info">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text
                                className="player-name"
                                style={isMe ? { textDecoration: 'underline' } : {}}
                            >
                              {player.rank}. {player.displayName}
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