"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Statistic, Row, Col, Button, Typography, Divider, Spin, Badge } from "antd";
import { UserOutlined, ArrowLeftOutlined, TrophyOutlined, CalendarOutlined, RocketOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/user-profile.css";

interface UserStats {
  games_played: string;
  creation_date: string;
  games_won: string;
}

interface UserGetDTO {
  userId: number;
  username: string;
  token: string;
  stats: UserStats;
}

const { Title, Text } = Typography;

export default function UserProfile() {
  const [user, setUser] = useState<UserGetDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string | null>("token", null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<UserGetDTO>("/users/me", {
          Authorization: `Bearer ${token}`,
        });
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (error instanceof Error) {
          alert(`Error fetching user data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiService,token,router]);

  const handleBack = () => {
    router.push("/overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
        <Text className="loading-text">Loading profile...</Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <Text>User not found or error loading profile.</Text>
        <Button type="primary" onClick={handleBack}>
          Back to Overview
        </Button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          className="back-button"
          type="text"
        />
        <Title level={3} className="profile-title">Profile</Title>
        <div style={{ width: 32 }}></div> 
      </div>

      <div className="profile-content">
        <Card className="profile-card">
          <div className="profile-info">
            <Badge dot={false}>
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                className="profile-avatar" 
              />
            </Badge>
            <div className="profile-details">
              <Title level={4}>{user.username}</Title>
              <Text type="secondary">User ID: {user.userId}</Text>
            </div>
          </div>

          <Divider />

          <Title level={5} className="stats-title">User Statistics</Title>
          <Row gutter={[16, 16]} className="stats-container">
            <Col xs={24} sm={8}>
              <Statistic 
                title="Games Played" 
                value={user.stats.games_played} 
                prefix={<RocketOutlined />} 
                className="stat-item"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="Games Won" 
                value={user.stats.games_won} 
                prefix={<TrophyOutlined />} 
                className="stat-item"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="Member Since" 
                value={user.stats.creation_date} 
                prefix={<CalendarOutlined />} 
                className="stat-item"
              />
            </Col>
          </Row>

          <div className="profile-actions">
            <Button 
              type="primary" 
              danger
              onClick={handleLogout}
              className="logout-button"
            >
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}