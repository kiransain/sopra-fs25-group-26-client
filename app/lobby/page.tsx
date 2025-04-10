"use client";

import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";  
import { Button, Form, Input } from "antd";

interface Player {
    id: number;
    username: string;
}

export default function Page(){
    const [players, setPlayers] = useState<Player[]>([]); //init state for players
    const [canStart, setCanStart] = useState(false);  // init state for start (because 5 players are needed)
    const gameId = 2;

    const fetchPlayers = async (gameId: number) => {
        const response = await fetch(`/games/${gameId}/players`);
        const players = await response.json();
        setPlayers(players);
      };
      
      const checkIfCanStart = async (gameId: number) => {
        const response = await fetch(`/games/${gameId}/canStart`);
        const canStart = await response.json();
        setCanStart(canStart);
      };
      
    
    const startGame = async (gameId: number) => {
        const response = await fetch(`/game/start/${gameId}`, {
            method: 'POST'
        });
        const message = await response.json();
        alert(message);  
    };
    
    useEffect(() => {
        console.log(gameId);
        if (gameId !== undefined) {  
            fetchPlayers(gameId);
            checkIfCanStart(gameId);
        }
    }, [gameId]);
    
    return (
        <div>
            TEST
            <ul>
                {players.map((player, index) => (
                    player.id !== undefined && player.username !== undefined ? (
                        <li key={index}>{player.username}</li>
                    ) : null
                ))}
            </ul>
            {canStart !== undefined && canStart && gameId !== undefined && (
                <button onClick={() => startGame(gameId)}>Start Game</button>
            )}
        </div>
    );
    
    
}