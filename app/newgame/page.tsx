"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, List, message, Spin, Card, Tag, Form, Input } from "antd";
import Link from "next/link";
import "@/styles/login-module.css";
import useLocalStorage from "@/hooks/useLocalStorage";



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
  const token = useLocalStorage("token", "");


  const fetchLobbyData = async () => {
    try {
      setLoading(true);
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://your-production-server.com';

      const response = await fetch(`${backendUrl}/games`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch games");
      const games = await response.json();

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
    
          //get user's current location
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
    
          const response = await fetch(`${backendUrl}/games`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              gamename: values.gameName,
              locationLat: position.coords.latitude,
              locationLong: position.coords.longitude
            })
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create game");
          }
          
          const game = await response.json();
          
          // redirect to lobbyv2 page with the game ID
          router.push(`/lobbyv2/${game.id}`);
    
        } catch (error) {
          if (error instanceof Error) {
            message.error(`Failed to create game: ${error.message}`);
          } else {
            message.error("An unknown error occurred");
            console.error("An unknown error occurred");
          }
        } finally {
          setLoading(false);
        }
      };

  useEffect(() => {
    if (token) {
      fetchLobbyData();
      const interval = setInterval(fetchLobbyData, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

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