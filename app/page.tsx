"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import Link from "next/link";
import "@/styles/login-module.css";

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      // Call the API service
      const response = await apiService.post<User>("/login", values);

      // Store token if available
      if (response.token) {
        setToken(response.token);
      }

      // Navigate to the map/home page
      router.push("/overview");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Login failed:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  return (
    <div className="manhunt-login-container">
      <div className="login-card">
        <h1 className="app-title">ManHunt</h1>
        
        <div className="logo-container">
          <div className="man-logo">
            <div className="pin-marker"></div>
          </div>
        </div>
        
        <Form
          form={form}
          name="login"
          size="large"
          onFinish={handleLogin}
          layout="vertical"
          className="login-form"
        >
          <Form.Item 
          name="username" 
          className="form-item"
             rules={[{ required: true, message: "Please input your username!" }]}
             >
            <Input placeholder="Username" />
          </Form.Item>
          
          <Form.Item 
            name="password" 
           className="form-item"
             rules={[{ required: true, message: "Please input your password!" }]}
             >
            <Input.Password placeholder="Password" />
           </Form.Item>
          
          <Form.Item className="form-button">
            <Button type="primary" htmlType="submit" className="login-button">
              Log in
            </Button>
          </Form.Item>
        </Form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <div className="signup-link">
          <Link href="/signup" className="signup-button">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
