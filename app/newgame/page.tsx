"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, List, message, Spin, Card, Tag, Form, Input } from "antd";
import Link from "next/link";
import "@/styles/login-module.css";

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

export default function NewGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState("");
  const router = useRouter();

  const fetchLobbyData = async () => {
    try {
      setLoading(true);
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://your-production-server.com';

      // Fetch available games
      const gamesResponse = await fetch(`${backendUrl}/games`);
      if (!gamesResponse.ok) throw new Error("Failed to fetch games");
      const games = await gamesResponse.json();

      // For the lobby page, we might want to show available games to join
      // This is just a placeholder - adjust based on your actual API response
      setPlayers(games.map((game: any) => ({
        id: game.id,
        username: game.name
      })));

    } catch (error) {
      message.error("Failed to load lobby data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (values: { gameName: string }) => {
    try {
      setLoading(true);
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://your-production-server.com';

      const response = await fetch(`${backendUrl}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.gameName
        })
      });

      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      
      // Redirect to the specific game lobby
      router.push(`/lobby/${game.id}`);

    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to create game: ${error.message}`);
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbyData();
    const interval = setInterval(fetchLobbyData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="manhunt-login-container">
      <div className="login-card">
        <h1 className="app-title">ManHunt</h1>

        <div className="logo-container">
          <div className="man-logo-reg">
            <div className="pin-marker-reg"></div>
          </div>
        </div>

        <div className="intro-text">
          <h2 className="intro-title">Game Lobby</h2>
          <p className="intro-subtitle">Create or join a game</p>
        </div>
        
        <Form
          name="createGame"
          size="large"
          onFinish={handleCreateGame}
          layout="vertical"
          className="login-form"
        >
          <Form.Item 
            name="gameName" 
            className="form-item"
            rules={[{ required: true, message: "Please enter a game name!" }]}
          >
            <Input placeholder="Game Name" />
          </Form.Item>
          
          <Form.Item className="form-button">
            <Button type="primary" htmlType="submit" className="login-button">
              Create Game
            </Button>
          </Form.Item>
        </Form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <Spin spinning={loading}>
          <div className="available-games">
            <h3 className="font-medium mb-2">Join available Games ({players.length}):</h3>
            <List
              dataSource={players}
              renderItem={(player) => (
                <List.Item 
                  className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={() => router.push(`/lobby/${player.id}`)}
                >
                  <List.Item.Meta
                    title={player.username}
                    description={`Game ID: ${player.id}`}
                  />
                </List.Item>
              )}
            />
          </div>
        </Spin>
      </div>
    </div>
  );
}