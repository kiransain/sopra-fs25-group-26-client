"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Statistic, Row, Col, Button, Typography, Divider, Spin, Badge, Modal, Form, Input, message } from "antd";
import { UserOutlined, ArrowLeftOutlined, TrophyOutlined, CalendarOutlined, RocketOutlined, StarOutlined, FireOutlined, SettingOutlined, LockOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/user-profile.css";
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

export default function UserProfile() {
  const [user, setUser] = useState<UserGetDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string | null>("token", null);
  const playClick = useAudio('/sounds/button-click.mp3', 0.3);


  useEffect(() => {
    if (!token)
      return;
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<UserGetDTO>("/me", {
          Authorization: `Bearer ${token}`,
        });
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (error instanceof Error) {
          message.error(`Error fetching user data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiService, token, router]);

  const handleBack = () => {
    router.push("/overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };
  
  const showSettingsModal = () => {
    form.resetFields();
    setIsSettingsModalVisible(true);
  };

  const handleCancel = () => {
    setIsSettingsModalVisible(false);
  };

  const handleUpdatePassword = async (values: { password: string }) => {
    if (!user) return;
    
    setUpdateLoading(true);
    try {
      await apiService.put(
        `/users/${user.userId}`,
        { password: values.password },
        { Authorization: `Bearer ${token}` }
      );
      
      message.success("Password updated successfully!");
      setIsSettingsModalVisible(false);
    } catch (error) {
      console.error("Failed to update password:", error);
      message.error("Failed to update password. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
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
                src={user.profilePicture} 
                className="profile-avatar" 
              />
            </Badge>
            <div className="profile-details">
              <div className="username-container">
                <Title level={4}>{user.username}</Title>
                <Button 
                  type="text" 
                  icon={<SettingOutlined />} 
                  onClick={showSettingsModal}
                  className="settings-button"
                  aria-label="Settings"
                />
              </div>
              <Text type="secondary">User ID: {user.userId}</Text>
              <Text type="secondary" className="join-date">
                <CalendarOutlined style={{ marginRight: 5 }} /> 
                Member since: {user.stats.creation_date}</Text>
            </div>
          </div>

          <Divider />

          <Title level={5} className="stats-title">User Statistics</Title>
          <Row gutter={[16, 16]} className="stats-container">
            <Col xs={24} sm={8}>
              <Statistic 
                title="Games Played" 
                value={user.stats.gamesPlayed}
                prefix={<RocketOutlined />} 
                className="stat-item"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="Games Won" 
                value={user.stats.wins}
                prefix={<TrophyOutlined />} 
                className="stat-item"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="Points" 
                value={user.stats.points}
                prefix={<StarOutlined />} 
                className="stat-item"
              />
            </Col>
          </Row>
          <Button 
            type="primary"
            icon={<FireOutlined />}
            onClick={() => router.push('/rankings')}
            className="view-rankings-button"
            style={{ marginBottom: 10 }}
          >
            View Leaderboard
          </Button>
          <div className="profile-actions">
            <Button 
              type="primary" 
              danger
              onClick={() => {playClick(); handleLogout();}}
              className="logout-button"
            >
              Log Out
            </Button>
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      <Modal
        title="Update Password"
        open={isSettingsModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="settings-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdatePassword}
        >
          <Form.Item
            name="password"
            label="New Password"
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter your new password" 
            />
          </Form.Item>
          <Form.Item className="modal-buttons">
            <Button type="default" onClick={() => {playClick(); handleCancel();}} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={updateLoading} onClick={playClick}>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}