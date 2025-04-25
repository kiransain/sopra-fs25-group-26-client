"use client"

import { Table, Button, Card } from 'antd';
import { useRouter } from 'next/navigation';
import '@/styles/leaderboard.css';
import { TrophyOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";


interface PlayerGetDTO {
  playerId: number;
  userId: number;
  role: 'HUNTER' | 'HIDER'; // PlayerRole enum
  status: 'HIDING' | 'HUNTING' | 'FOUND'; // PlayerStatus enum
  outOfArea: boolean;
  foundTime: string; // LocalDateTime as string
  locationLat: number | null;
  locationLong: number | null;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string; // LocalDateTime as string
  radius: number;
  creatorId: number;
  players: PlayerGetDTO[];
}

export default function Page(){
const router = useRouter();
const handleExit = () => {
    router.push('/overview');
  };

// placeholder data
const dataSource = [
  {
    key: '1',
    rank: 1,
    name: 'Player One',
    timePlayed: '25:43'
  },
  {
    key: '2',
    rank: 2,
    name: 'Player Two',
    timePlayed: '30:12'
  },
  {
    key: '3',
    rank: 3,
    name: 'Player Three',
    timePlayed: '45:08'
  },
];

const columns = [
  {
    title: 'Rank',
    dataIndex: 'rank',
    key: 'rank',
  },
  {
    title: 'Player Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Time Played',
    dataIndex: 'timePlayed',
    key: 'timePlayed',
  },
];

  return (
    <div className="leaderboard-container">
        <Card className="leaderboard-card">
            <h1 className="leaderboard-title">
                <TrophyOutlined style={{ marginRight: 8, color: '#000000' }} />
                Leaderboard
            </h1>
        <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            className="leaderboard-table"
        />
        <div className="leaderboard-buttons">
            <Button className="leaderboard-button black-button">Play Again</Button>
            <Button className="leaderboard-button red-button" onClick={handleExit}>Exit</Button>
        </div>
        </Card>
    </div>
  );
};

