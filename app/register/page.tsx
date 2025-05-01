"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import Link from "next/link";
import { Button, Form, Input, Upload, message } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import "@/styles/login-module.css";
import { useState } from "react";


const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  
  const logInAfterRegistration = async (username: string, password: string) => { // awaiting function executed when Login submitted, takes in values in form of FormFields
    try {
        // Call the API service and let it handle JSON serialization and error handling
        const response = await apiService.post<User>("/login",{username, password}); // awaits the response of the POST to server with expected form of a User. It sends {values} (POST) to endpoint "/users"

        // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
        if (response.token != null) {
            setToken(response.token);
            return true;

        } return false;
    } catch (error) {
        if (error instanceof Error) {
            messageApi.error(error.message);
        } else {
          messageApi.error("An unknown error occurred during login.");
        }
    }
}

  const handleRegister = async (values: { username: string; password: string}) => {
    try {
      const userData = {
        username: values.username,
        password: values.password,
        profilePicture: fileList.length > 0 ? fileList[0].thumbUrl : undefined
      };
        const response = await apiService.post<User>("/users", userData);

        if (response.username != null) {
            const loggedIn = await logInAfterRegistration(values.username, values.password);

            if (loggedIn) {
                // Navigate to the user overview
                router.push("/overview");
            }
        }
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      } else {
        messageApi.error("An unknown error occurred during login.");
      }
  }
};


const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
  setFileList(newFileList);
};

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    messageApi.error('You can only upload JPG/PNG files!');
    return false;
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    messageApi.error('Image must be smaller than 1MB!');
    return false;
  }
  return true;
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
         <Form.Item className="avatar-upload-container">
            <Upload
              listType="picture-circle"
              fileList={fileList}
              onChange={handleChange}
              beforeUpload={beforeUpload}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

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
            <Button type="primary" htmlType="submit" className="login-button">
              Sign Up
            </Button>
          </Form.Item>
        </Form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        
        <div className="signup-link">
          <Link href="/" className="signup-button">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;