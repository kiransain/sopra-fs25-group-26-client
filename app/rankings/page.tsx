"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Table, 
  Typography, 
  Button, 
  Avatar, 
  Space, 
  Spin, 
  Alert,
  Card
} from "antd";
import { ColumnsType } from 'antd/es/table';
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  TrophyOutlined,
  CrownOutlined
} from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/rankings.css";
import { useAudio } from "@/hooks/useAudio";

interface UserStats {
  gamesPlayed: string;
  creation_date: string;
  wins: string;
  points: string; 
}

interface UserGetDTO {
  userId: number;
  username: string;
  token: string;
  stats: UserStats;
  profilePicture?: string;
}

const { Title, Text } = Typography;

export default function Leaderboard() {
  const [users, setUsers] = useState<UserGetDTO[]>([]);
  const [currentUser, setCurrentUser] = useState<UserGetDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string | null>("token", null);
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const userData = await apiService.get<UserGetDTO>("/me", {
          Authorization: `Bearer ${token}`,
        });
        setCurrentUser(userData);

        const leaderboardData = await apiService.get<UserGetDTO[]>("/users", {
          Authorization: `Bearer ${token}`,
        });
        
        const sortedUsers = leaderboardData.sort((a, b) => 
          parseInt(b.stats.points || "0") - parseInt(a.stats.points || "0")
        );
        
        setUsers(sortedUsers);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        if (error instanceof Error) {
          setError(`Error loading leaderboard: ${error.message}`);
        } else {
          setError("Unknown error occurred while loading the leaderboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiService, token, router]);

  const handleBack = () => {
    router.push("/overview/profile");
  };

  const columns: ColumnsType<UserGetDTO> = [
    {
      title: "Rank",
      key: "rank",
      width: 80,
      render: (_text: string, _record: UserGetDTO, index: number) => (
        <div className="rank-cell">
          {index + 1 === 1 && <CrownOutlined className="crown gold" />}
          {index + 1 === 2 && <CrownOutlined className="crown silver" />}
          {index + 1 === 3 && <CrownOutlined className="crown bronze" />}
          {index + 1 > 3 && <span className="rank-number">{index + 1}</span>}
        </div>
      ),
    },
    {
      title: "Player",
      dataIndex: "username",
      key: "username",
      render: (username: string, record: UserGetDTO) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            src={record.profilePicture}
            className={currentUser?.userId === record.userId ? "current-user-avatar" : ""}
          />
          <span className={currentUser?.userId === record.userId ? "current-user-name" : ""}>
            {username}
            {currentUser?.userId === record.userId}
          </span>
        </Space>
      ),
    },
    {
  title: "Points",
  dataIndex: ["stats", "points"],
  key: "points",
  render: (points: string) => (
    <span className="points-value">
      <TrophyOutlined className="trophy-icon" /> {points || "0"}
    </span>
  ),
},
    {
      title: "Games Played",
      dataIndex: ["stats", "gamesPlayed"],
      key: "gamesPlayed",
      responsive: ['md'],
    },
    {
      title: "Wins",
      dataIndex: ["stats", "wins"],
      key: "wins",
      responsive: ['md'],
    }
  ];

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <Spin size="large" />
        <Text className="loading-text">Loading leaderboard...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
        <Button type="primary" onClick={() => {playClick(); handleBack()}} className="back-button">
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => {playClick(); handleBack()}}
          className="back-button"
          type="text"
        />
        <Title level={3} className="leaderboard-title">Leaderboard</Title>
        <div style={{ width: 32 }}></div>
      </div>

      <Card className="leaderboard-table-card">
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="userId"
          pagination={{ pageSize: 10 }}
          className="leaderboard-table"
          rowClassName={(record) => 
            currentUser?.userId === record.userId ? 'current-user-row' : ''
          }
        />
      </Card>
    </div>
  );
}