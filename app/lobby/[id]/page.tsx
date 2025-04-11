"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, List, message, Spin } from "antd";

interface Player {
    id: number;
    username: string;
}

export default function GameLobby({ params }: { params: { gameId: string } }) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [canStart, setCanStart] = useState(false);
    const router = useRouter();
    const gameId = Number(params.gameId);

    const fetchLobbyData = async () => {
        try {
            setLoading(true);
            
            // Fetch players
            const playersResponse = await fetch(`/games/${gameId}/players`, {
                headers: {
                    Authorization: localStorage.getItem("token") || "",
                },
            });
            
            if (!playersResponse.ok) throw new Error("Failed to fetch players");
            const playersData = await playersResponse.json();
            setPlayers(playersData);
            
            // Check if can start
            const canStartResponse = await fetch(`/games/${gameId}/canStart`, {
                headers: {
                    Authorization: localStorage.getItem("token") || "",
                },
            });
            
            if (!canStartResponse.ok) throw new Error("Failed to check start status");
            const canStartData = await canStartResponse.json();
            setCanStart(canStartData);
            
            // Check if current user is creator (first player is creator in your implementation)
            const userId = localStorage.getItem("userId");
            if (playersData.length > 0 && playersData[0].id === Number(userId)) {
                setIsCreator(true);
            }
        } catch (error) {
            message.error("Failed to load lobby data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = async () => {
        try {
            const response = await fetch(`/games/${gameId}/start`, {
                method: "POST",
                headers: {
                    Authorization: localStorage.getItem("token") || "",
                },
            });
            
            if (!response.ok) throw new Error("Failed to start game");
            
            // Redirect to game play page
            router.push(`/game/${gameId}/play`);
        } catch (error) {
            message.error("Failed to start game");
            console.error(error);
        }
    };

    const handleLeaveGame = async () => {
        try {
            const response = await fetch(`/api/games/${gameId}/leave`, {
                method: "POST",
                headers: {
                    Authorization: localStorage.getItem("token") || "",
                },
            });
            
            if (!response.ok) throw new Error("Failed to leave game");
            
            // Redirect to games list
            router.push("/games");
        } catch (error) {
            message.error("Failed to leave game");
            console.error(error);
        }
    };

    useEffect(() => {
        fetchLobbyData();
        const interval = setInterval(fetchLobbyData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [gameId]);

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Game Lobby</h1>
            <p className="mb-4">Game ID: {gameId}</p>
            
            <Spin spinning={loading}>
                <List
                    dataSource={players}
                    renderItem={(player) => (
                        <List.Item>
                            <List.Item.Meta
                                title={player.username}
                                description={`Player ID: ${player.id}`}
                            />
                            {player.id === Number(localStorage.getItem("userId")) && (
                                <span className="text-blue-500">(You)</span>
                            )}
                        </List.Item>
                    )}
                />
                
                <div className="mt-4 flex gap-2">
                    {isCreator && (
                        <Button 
                            type="primary" 
                            onClick={handleStartGame}
                            disabled={!canStart}
                        >
                            Start Game ({players.length}/5)
                        </Button>
                    )}
                    
                    <Button 
                        danger
                        onClick={() => {
                            router.push('/overview'); 
                          }}
                    >
                        Leave Game
                    </Button>
                </div>
            </Spin>
        </div>
    );
}