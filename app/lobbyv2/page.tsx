"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, List, message, Spin, Card, Tag } from "antd";

interface Player {
  id: number;
  username: string;
}

interface GameInfo {
  id: number;
  name: string;
  creator: string;
  status: string;
}

export default function GameLobby({ params }: { params: { gameId: string } }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const gameId = params.gameId;

  const fetchLobbyData = async () => {
    try {
      setLoading(true);
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://your-production-server.com';

      // Fetch game info
      const gameResponse = await fetch(`${backendUrl}/games/${gameId}`);
      if (!gameResponse.ok) throw new Error("Failed to fetch game info");
      setGameInfo(await gameResponse.json());

      // Fetch players
      const playersResponse = await fetch(`${backendUrl}/games/${gameId}/players`);
      if (!playersResponse.ok) throw new Error("Failed to fetch players");
      setPlayers(await playersResponse.json());

    } catch (error) {
      message.error("Failed to load lobby data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbyData();
    const interval = setInterval(fetchLobbyData, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Game Lobby</h1>
      
      <Spin spinning={loading}>
        {gameInfo && (
          <Card className="mb-4">
            <h2 className="text-lg font-semibold">{gameInfo.name}</h2>
            <p>Created by: {gameInfo.creator}</p>
            <p>Status: <Tag color={gameInfo.status === 'WAITING' ? 'orange' : 'green'}>
              {gameInfo.status}
            </Tag></p>
            <p>Game ID: {gameId}</p>
          </Card>
        )}
        
        <h3 className="font-medium mb-2">Players ({players.length}):</h3>
        <List
          dataSource={players}
          renderItem={(player) => (
            <List.Item>
              <List.Item.Meta
                title={player.username}
                description={`Player ID: ${player.id}`}
              />
            </List.Item>
          )}
        />
        
        <div className="mt-4 flex gap-2">
          <Button 
            danger
            onClick={() => router.push('/overview')}
          >
            Leave Game
          </Button>
        </div>
      </Spin>
    </div>
  );
}