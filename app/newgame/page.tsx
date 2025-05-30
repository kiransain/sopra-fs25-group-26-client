"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Button, Form, Input, InputNumber, message } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/newgame-module.css";
import { useAudio } from "@/hooks/useAudio";


interface GamePostDTO {
  gamename: string;
  locationLat: number;
  locationLong: number;
  radius: number;
  preparationTimeInSeconds: number;
  gameTimeInSeconds: number;
}

interface GameGetDTO {
  gameId: number;
  gamename: string;
  status: 'IN_GAME' | 'IN_GAME_PREPARATION' | 'FINISHED' | 'IN_LOBBY';
  centerLatitude: number;
  centerLongitude: number;
  timer: string;
  radius: number;
  creatorId: number;
  preparationTimeInSeconds: number;
  gameTimeInSeconds: number;
}

const NewGame: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const playClick = useAudio('/sounds/button-click.mp3', 0.3); // audio
  const playPowerUp2 = useAudio('/sounds/powerup2.mp3', 0.3);
  const [messageApi, contextHolder] = message.useMessage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (errorMessage) {
      messageApi.info(errorMessage);
      setErrorMessage(null);
    }
  }, [errorMessage, messageApi]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please allow location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleCreateGame = async (values: {
    radius: number;
    preparationTime: number;
    gameTime: number;
    gameName: string}) => {
    if (!currentLocation) {
      alert('Location not available. Please ensure location services are enabled and try going to overview and refresh the page.');
      return;
    }

    setIsLoading(true);

    try {
      const gameData: GamePostDTO = {
        gamename: values.gameName,
        locationLat: currentLocation.lat,
        locationLong: currentLocation.lng,
        radius: values.radius,
        preparationTimeInSeconds: values.preparationTime,
        gameTimeInSeconds: values.gameTime
      };


      const response = await apiService.post<GameGetDTO>("/games", gameData,{
        Authorization: `Bearer ${token}`,
      });

      router.push(`/games/${response.gameId}`);
    } catch (error: unknown) {
      setErrorMessage("Gamename already taken. Please try another name.");
      console.error("An error occurred while creating the game." + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="newgame-container">
      <div className="newgame-header">
        {/* Exit arrow near header */}
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() =>{playClick(); router.push('/overview');}}
                    className="tutorial-back-button"
                    type="text"
                    size="large"
                  />
        <h1 className="newgame-title">ManHunt</h1>
      </div>

      <div className="newgame-content">
        <div className="game-creation-visual">
          <div className="radar-animation">
            <div className="radar-sweep" />
            <div className="radar-center" />
            <div className="radar-glow" />
          </div>
          <div className="hunter-silhouette" />
        </div>

        <Form
          form={form}
          name="newgame"
          onFinish={handleCreateGame}
          layout="vertical"
          className="newgame-form"
          initialValues={{
            radius: 25.0,
            preparationTime: 30,
            gameTime: 60
          }}
        >
          <Form.Item
            name="gameName"
            rules={[{ required: true, message: "Please input a game name!" }]}
          >
            <Input
              placeholder="Game Name"
              className="game-name-input"
              prefix={<span className="input-icon">🔍</span>}
            />
          </Form.Item>

          <div className="game-settings-grid">
            <Form.Item
              name="radius"
              label={
                <span className="setting-label">
                  <span className="icon">📏</span> Game Radius between 5 - 100m 
                </span>
              }
              rules={[{ required: true, message: "Please input game radius between 5 - 100m !" }]}
            >
              <InputNumber
                min={5.0}
                max={100}
                step={1.0}
                className="game-input"
                addonAfter="m"
              />
            </Form.Item>

            <Form.Item
              name="preparationTime"
              label={
                <span className="setting-label">
                  <span className="icon">⏱️</span> Preparation time between 10 - 300 sec
                </span>
              }
              rules={[{ required: true, message: "Please input preparation time between 10 - 300 sec!" }]}
            >
              <InputNumber
                min={10}
                max={300}
                className="game-input"
                addonAfter="sec"
              />
            </Form.Item>

            <Form.Item
              name="gameTime"
              label={
                <span className="setting-label">
                  <span className="icon">⌛</span> Game Duration between 60 and 900 sec
                </span>
              }
              rules={[{ required: true, message: "Please input game duration between 60-900 sec!" }]}
            >
              <InputNumber
                min={60}
                max={900}
                className="game-input"
                addonAfter="sec"
              />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="create-button"
              loading={isLoading}
              onClick = {playPowerUp2}
            >
              Create Game
            </Button>
          </Form.Item>
        </Form>
      </div>
      </div>
    </>
  );
};
export default NewGame;