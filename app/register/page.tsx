"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input,message } from "antd";
import Link from "next/link";
import "@/styles/login-module.css";
import { useAudio } from "@/hooks/useAudio";


const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const [messageApi, contextHolder] = message.useMessage();
  const playClick = useAudio('/sounds/button-click.mp3', 0.5); // audio


  const logInAfterRegistration= async (username: string, password: string) => { // awaiting function executed when Login submitted, takes in values in form of FormFields
    try {
        // Call the API service and let it handle JSON serialization and error handling
        const response = await apiService.post<User>("/login",{username, password, profilePicture: null}); // awaits the response of the POST to server with expected form of a User. It sends {values} (POST) to endpoint "/users"

        // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
        if (response.token != null) {
            setToken(response.token);
            return true;

        } return false;
    } catch (error) {
        if (error instanceof Error) {
            alert(`Something went wrong during the login:\n${error.message}`);
        } else {
            console.error("An unknown error occurred during login.");
        }
    }
}

  const handleRegister = async (values: { username: string; password: string }) => {
    try {
        // Call the API service and let it handle JSON serialization and error handling
        console.log(values);
        const response = await apiService.post<User>("/users", values);

        if (response.username != null) {
            const loggedIn = await logInAfterRegistration(values.username, values.password);

            if (loggedIn) {
                // Navigate to the user overview
                router.push("/overview");
            }
        }
    } catch (error) {
      if (error instanceof Error) {
          messageApi.error(`Username already exists`);
      } else {
         messageApi.error("An unknown error occurred during login.");
      }
  }
};

return (
  <div className="manhunt-login-container">
    {contextHolder}
    <div className="login-card">
      <h1 className="app-title">ManHunt</h1>

      <div className="logo-container">
        <div className="man-logo-reg">
          <div className="pin-marker-reg"></div>
        </div>
      </div>

      <div className="intro-text">
        <h2 className="intro-title">Create an account</h2>
        <p className="intro-subtitle">Enter your credentials to sign here</p>
      </div>
        
        <Form
          form={form}
          name="register"
          size="large"
          onFinish={handleRegister}
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

          
          <Form.Item 
            name="confirmPassword"
            className="form-item"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>
          
         
          <Form.Item className="form-button">
            <Button type="primary" htmlType="submit" className="login-button" onClick = {playClick}>
              Sign Up
            </Button>
          </Form.Item>
        </Form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        
        <div className="signup-link">
          <Link href="/" className="signup-button" onClick = {playClick}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;