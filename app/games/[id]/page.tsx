"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, Button, List, Tag, Tooltip, Typography, Collapse, Badge, message } from 'antd';
import { UserOutlined, ReloadOutlined, PlayCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import "@/styles/lobby.css";
import useLocalStorage from "@/hooks/useLocalStorage";

const { Panel } = Collapse;

interface PlayerGetDTO {
  playerId: number;
  userId: number;
  username: string;
  role: 'HUNTER' | 'HIDER';
  status: 'HIDING' | 'HUNTING' | 'FOUND';
  outOfArea: boolean;
  foundTime: string;
  locationLat: number | null;
  locationLong: number | null;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string;
  radius: number;
  creatorId: number;
  players: PlayerGetDTO[];
}

const { Title, Text } = Typography;

export default function Page() {
  const [games, setGames] = useState<GameGetDTO[]>([]);
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [activePanels, setActivePanels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exiting, setExiting] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);


  const fetchGames = async () => {
    try {
      const gamesData = await apiService.get<GameGetDTO[]>('/games', {
        Authorization: `Bearer ${token}`,
      });
      setGames(gamesData);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, []);

  // To get the current location.
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          message.warning('Could not get your location');
        }
      );
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'IN_LOBBY': return 'blue';
      case 'IN_GAME': return 'green';
      case 'FINISHED': return 'gray';
      default: return 'default';
    }
  };

  const getPlayerStatusColor = (status: string) => {
    switch(status) {
      case 'HIDING': return 'blue';
      case 'HUNTING': return 'red';
      case 'FOUND': return 'green';
      default: return 'default';
    }
  };

  const getPlayerRoleIcon = (role: string) => {
    return role === 'HUNTER' ? '🔍' : '🏃';
  };


  const handleStartGame = async (gameId: number) => {
    setStarting(true);
    try {
      if (!currentLocation) {
        throw new Error('Current location not available');
      }
        const updatedGame = await apiService.put<GameGetDTO>(
        `/games/${gameId}`, 
        {
          startGame: true,
          locationLat: currentLocation.lat,
          locationLong: currentLocation.lng
        });
  
      message.success('Game started successfully!');
      router.push(`/games/${gameId}/game`);
      
    } catch (error: unknown) {
      let errorMessage = 'Failed to start game';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error starting game:', error);
        
        // Handle API error responses
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const apiError = error as { response?: { data?: { message?: string } } };
          if (apiError.response?.data?.message) {
            errorMessage = apiError.response.data.message;
          }
        }
      }
      
      message.error(errorMessage);
    } finally {
      setStarting(false);
    }
  };


  const handleExitGame = async (gameId: number) => {
    setExiting(true);
    try {
      await apiService.delete(`/games/${gameId}/players`);
      message.success('Left the game successfully');
      router.push('/overview');
    } catch (error) {
      message.error('Failed to leave game');
      console.error(error);
    } finally {
      setExiting(false);
    }
  };

  const handlePanelChange = (keys: string | string[]) => {
    setActivePanels(Array.isArray(keys) ? keys : [keys]);
  };

  // this checks if current user is in any game.
  const isPlayerInGame = games.some(game => 
    game.players.some(player => player.userId.toString() === localStorage.getItem("userId"))
  );

  return (
    <div className="games-page">
      <header className="games-header">
        <Title level={3} className="games-title">ManHunt</Title>
        <Tooltip title="Profile">
          <Avatar 
            icon={<UserOutlined />} 
            size="large" 
            className="profile-avatar"
            onClick={() => router.push('/overview/profile')} 
          />
        </Tooltip>
      </header>

      <div className="games-content">
        <div className="games-card">
          <div className="games-list-header">
            <Title level={4} className="games-list-title">
              {games.length > 0 ? games[0].gamename : 'No Active Games'}
            </Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchGames}
              loading={loading}
              className="refresh-button"
            />
          </div>

          {/* GLOBAL BUTTONS (visible to everyone) */}
          <div className="global-game-actions">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={starting}
              onClick={() => handleStartGame(games[0]?.gameId)} // Starts the first game
              className="start-game-button"
              disabled={!games.length || games[0]?.status !== 'IN_LOBBY'}
            >
              Start Game
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={exiting}
              onClick={async () => {
                await handleExitGame(games[0]?.gameId); 
                router.push('/overview');         
              }}
              className="exit-game-button"
            >
              Exit Game
            </Button>
          </div>

        <div className="games-list">
          {games.map(game => {
            const isCreator = game.creatorId.toString() === localStorage.getItem("userId");
            const isInThisGame = game.players.some(p => p.userId.toString() === localStorage.getItem("userId"));
            
            return (
              <div key={game.gameId.toString()} className="game-panel">
                <div className="game-panel-header">
                  <div>
                    <Text strong>{game.gamename}</Text>
                    <Tag color={getStatusColor(game.status)} className="game-status-tag">
                      {game.status}
                    </Tag>
                  </div>
                  <Badge 
                    count={game.players.length} 
                    showZero 
                    color={game.status === 'IN_LOBBY' ? '#1890ff' : '#52c41a'}
                    className="player-count-badge"
                  />
                </div>

                {isInThisGame && (
                  <div className="game-actions">
                    {isCreator && game.status === 'IN_LOBBY' && (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        loading={starting}
                        onClick={() => handleStartGame(game.gameId)}
                        className="start-game-button"
                      >
                        Start Game
                      </Button>
                    )}
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={exiting}
                      onClick={() => handleExitGame(game.gameId)
      
                      }
                      className="exit-game-button"
                    >
                      Exit
                    </Button>
                  </div>
                )}

                <div className="game-details">
                  <Text type="secondary">Radius: {game.radius}m</Text>
                  <Text strong className="players-title">Players:</Text>
                  <List
                    dataSource={game.players}
                    renderItem={player => (
                      <List.Item className="player-item">
                        <div className="player-info">
                          <Avatar 
                            size="small" 
                            icon={<UserOutlined />}
                            className="player-avatar"
                          />
                          <Text className="player-name">
                            {player.username || `Player ${player.userId}`}
                            {player.userId === game.creatorId && (
                              <Tag color="gold" className="creator-tag">Creator</Tag>
                            )}
                          </Text>
                          <div className="player-status-container">
                            <Tooltip title={player.role}>
                              <span className="player-role-icon">{getPlayerRoleIcon(player.role)}</span>
                            </Tooltip>
                            <Tag color={getPlayerStatusColor(player.status)} className="player-status-tag">
                              {player.status}
                            </Tag>
                            {player.outOfArea && <Tag color="orange">Out of Area</Tag>}
                          </div>
                        </div>
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No players in this game' }}
                    className="players-list"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}