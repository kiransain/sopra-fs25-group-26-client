"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { Avatar, Button, Card, List, Tag, Typography, message, Row, Col, Space } from 'antd';
import { UserOutlined, CrownFilled, TrophyFilled, FireFilled, CloseOutlined } from '@ant-design/icons';
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
  displayName: string;
  displayPicture: string;
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
  const [currentUser, setCurrentUser] = useState<UserGetDTO | null>(null);
  const currentPlayer = game
    ? game.players.find(p => p.userId === currentUser?.userId) ?? null
    : null;

  const sortedPlayers = game
    ? [...game.players].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
    : [];

  const { value: token } = useLocalStorage<string | null>("token", null);
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId;
  const apiService = useApi();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);


  const fetchGame = useCallback(async () => {
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
  }, [currentLocation, currentUser, apiService, gameId, token, router]);

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

  useEffect(() => {
    if (!token || !gameId || !currentUser || !currentLocation) return;
    fetchGame();
    const interval = setInterval(fetchGame, 10000);

    return () => clearInterval(interval);
  }, [token, gameId, currentUser, currentLocation, fetchGame]);

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
        <Card className="game-card">
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {game ? game.gamename : 'Loading Game...'}
              </Title>
            </Col>
            <Col>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {playClick(); handleExitGame();}}
                className="exit-game-button"
                style={{ color: '#8c8c8c' }}
              />
            </Col>
          </Row>

          <Card 
            title={
              <Space>
                <TrophyFilled style={{ color: '#faad14' }} />
                <span>Leaderboard</span>
              </Space>
            }
            className="leaderboard-card"
            headStyle={{ borderBottom: 0, paddingBottom: 0 }}
            bodyStyle={{ paddingTop: 8 }}
          >
            {/* Show the current player's placement */}
            {currentPlayer && (
              <div style={{ marginBottom: 16 }}>
                <Text>
                  You ranked {currentPlayer.rank} in this game.
                </Text>
              </div>
            )}
            <List
              dataSource={sortedPlayers}
              renderItem={(player, index) => {
                const isMe = currentPlayer?.playerId === player.playerId;
                
                return (
                  <List.Item 
                    key={player.playerId}
                    className={`player-item ${isMe ? 'current-player' : ''}`}
                  >
                    <Row align="middle" style={{ width: '100%' }}>
                      <Col span={2} style={{ textAlign: 'center' }}>
                        {index === 0 ? (
                          <CrownFilled className="medal-gold" />
                        ) : index === 1 ? (
                          <TrophyFilled className="medal-silver" />
                        ) : index === 2 ? (
                          <FireFilled className="medal-bronze" />
                        ) : (
                          <Text>{player.rank}.</Text>
                        )}
                      </Col>
                      <Col span={16}>
                        <Space>
                          <Avatar
                            src={player.displayPicture || undefined}
                            icon={!player.displayPicture ? <UserOutlined /> : undefined}
                            size="small"
                            className={isMe ? 'current-player-avatar' : ''}
                          />
                          <Text style={{ textDecoration: isMe ? 'underline' : 'none' }}>
                            {player.displayName}
                          </Text>
                          {player.playerId === game?.creatorId && (
                            <Tag color="gold">Creator</Tag>
                          )}
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Tag color={player.role === 'HUNTER' ? 'purple' : 'yellow'}>
                          {player.role}
                        </Tag>
                      </Col>
                    </Row>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Card>
      </div>
    </div>
  );
}