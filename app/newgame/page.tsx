"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Button, Form, Input } from "antd";
import { useState, useEffect } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/newgame-module.css";

interface GamePostDTO {
  gamename: string;
  locationLat: number;
  locationLong: number;
}

const NewGame: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { value: token } = useLocalStorage<string | null>("token", null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleCreateGame = async (values: {gameName: string}) => {
    if (!currentLocation) {
      alert('Location not available. Please ensure location services are enabled.');
      return;
    }
    
    setIsLoading(true);

    try {
      
      const gameData: GamePostDTO = {
        gamename: values.gameName,
        locationLat: currentLocation.lat,
        locationLong: currentLocation.lng
      };

      
      const response = await apiService.post<any>("/games", gameData,{
        Authorization: `Bearer ${token}`,
      });
      
      router.push("/overview");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to create game:\n${error.message}`);
      } else {
        console.error("An unknown error occurred while creating the game.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="newgame-container">
      <div className="newgame-header">
        <button 
          className="back-button" 
          onClick={() => router.back()}
        >
          &lt;
        </button>
        <h1 className="newgame-title">ManHunt</h1>
      </div>

      <div className="newgame-content">
        <Form
          form={form}
          name="newgame"
          onFinish={handleCreateGame}
          layout="vertical"
          className="newgame-form"
        >
          <Form.Item
            name="gameName"
            rules={[{ required: true, message: "Please input a game name!" }]}
          >
            <Input placeholder="Game Name" className="game-name-input" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="create-button"
              loading={isLoading}
            >
              Create
            </Button>
          </Form.Item>
        </Form>

        <p className="location-info">
          The game area will be created based on the location of the hunter
        </p>
      </div>
    </div>
  );
};

export default NewGame;