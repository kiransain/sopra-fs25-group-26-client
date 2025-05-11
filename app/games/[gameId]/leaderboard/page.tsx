"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { Avatar, Button, Card, Divider, List, Tag, Typography, message, Badge, Row, Col, Space } from 'antd';
import { UserOutlined, CrownFilled, TrophyFilled, FireFilled, CloseOutlined } from '@ant-design/icons';
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
        <Card className="game-card">
          {/* Header with subtle exit button */}
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
                onClick={handleExitGame}
                className="exit-game-button"
                style={{ color: '#8c8c8c' }}
              />
            </Col>
          </Row>

          {currentPlayer && (
            <Card 
              bordered={false}
              className="player-result-card"
              style={{
                backgroundColor: currentPlayer.rank === 1 ? '#fffbe6' : '#f6ffed',
                borderColor: currentPlayer.rank === 1 ? '#ffe58f' : '#b7eb8f',
                marginBottom: 24
              }}
            >
              <Row align="middle" gutter={16}>
                <Col>
                  <Avatar 
                    size={48} 
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: currentPlayer.rank === 1 ? '#ffc53d' : '#52c41a',
                      color: '#fff'
                    }}
                  />
                </Col>
                <Col>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {currentPlayer.displayName}
                  </Typography.Text>
                  <div style={{ marginTop: 4 }}>
                    <Space size="small">
                      <Tag color={currentPlayer.role === 'HUNTER' ? 'red' : 'green'}>
                        {currentPlayer.role}
                      </Tag>
                      {currentPlayer.rank === 1 ? (
                        <Tag icon={<CrownFilled />} color="gold">
                          WINNER
                        </Tag>
                      ) : (
                        <Tag>Rank #{currentPlayer.rank}</Tag>
                      )}
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

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
            <List
              dataSource={sortedPlayers}
              renderItem={(player, index) => {
                const isMe = currentPlayer?.playerId === player.playerId;
                const isTop3 = index < 3;
                
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
                            size="small" 
                            icon={<UserOutlined />}
                            className={isMe ? 'current-player-avatar' : ''}
                          />
                          <Text strong={isMe}>
                            {player.displayName}
                          </Text>
                          {player.playerId === game?.creatorId && (
                            <Tag color="gold">Creator</Tag>
                          )}
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Tag color={player.role === 'HUNTER' ? 'red' : 'green'}>
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