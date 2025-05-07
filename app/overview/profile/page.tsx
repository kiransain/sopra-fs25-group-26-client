"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Statistic, Row, Col, Button, Typography, Divider, Spin, Badge, Modal, Form, Input, message } from "antd";
import { UserOutlined, ArrowLeftOutlined, TrophyOutlined, CalendarOutlined, RocketOutlined, StarOutlined, FireOutlined, SettingOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/user-profile.css";

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

  useEffect(() => {
    if (!token)
      return;
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<UserGetDTO>("/me", {
          Authorization: `Bearer ${token}`,
        });
        setUser(userData);
        // Pre-fill the form with current username
        form.setFieldsValue({
          username: userData.username
        });
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
  }, [apiService, token, router, form]);

  const handleBack = () => {
    router.push("/overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };
  
  const showSettingsModal = () => {
    setIsSettingsModalVisible(true);
  };

  const handleCancel = () => {
    setIsSettingsModalVisible(false);
  };

  const handleUpdateUsername = async (values: { username: string }) => {
    if (!user) return;
    
    setUpdateLoading(true);
    try {
      await apiService.put(
        `/users/${user.userId}`,
        { username: values.username },
        { Authorization: `Bearer ${token}` }
      );
      
      setUser({
        ...user,
        username: values.username
      });
      
      message.success("Username updated successfully!");
      setIsSettingsModalVisible(false);
    } catch (error) {
      console.error("Failed to update username:", error);
      message.error("Failed to update username. Please try again.");
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
              onClick={handleLogout}
              className="logout-button"
            >
              Log Out
            </Button>
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      <Modal
        title="Update Username"
        open={isSettingsModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="settings-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUsername}
          initialValues={{ username: user.username }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter your username!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter your new username" />
          </Form.Item>
          <Form.Item className="modal-buttons">
            <Button type="default" onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={updateLoading}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}